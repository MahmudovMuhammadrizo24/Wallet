package app.hamyon.wallet;

import android.content.Intent;
import android.net.Uri;
import android.os.Build;
import android.os.Bundle;
import android.security.keystore.KeyGenParameterSpec;
import android.security.keystore.KeyPermanentlyInvalidatedException;
import android.security.keystore.KeyProperties;
import android.util.Base64;
import android.view.WindowManager;
import android.webkit.JavascriptInterface;
import android.webkit.WebResourceRequest;
import android.webkit.WebResourceResponse;
import android.webkit.WebSettings;
import android.webkit.WebView;
import android.webkit.WebViewClient;

import androidx.appcompat.app.AppCompatActivity;
import androidx.biometric.BiometricManager;
import androidx.biometric.BiometricPrompt;
import androidx.core.content.ContextCompat;
import androidx.webkit.WebViewAssetLoader;

import org.json.JSONObject;

import java.security.Key;
import java.security.KeyStore;

import javax.crypto.Cipher;
import javax.crypto.KeyGenerator;
import javax.crypto.SecretKey;
import javax.crypto.spec.GCMParameterSpec;

/**
 * Mening hamyonim: WebView ichida veb-ilovani (assets/www) ishga tushiradi.
 * - Faqat o'z fayllari yuklanadi (https://appassets.androidplatform.net), boshqa havolalar tizim brauzerida ochiladi.
 * - Ekran tasviri va "so'nggi ilovalar" rasmi o'chirilgan (FLAG_SECURE).
 * - Face ID / barmoq izi: Android Keystore kaliti faqat biometrik tasdiqdan keyin ishlaydi.
 */
public class MainActivity extends AppCompatActivity {

    private static final String HOST = "appassets.androidplatform.net";
    private static final String HOME = "https://" + HOST + "/assets/www/index.html";
    private static final String ALIAS = "hamyon_bio_v1";

    private WebView web;

    private interface Done {
        void run(Cipher cipher) throws Exception;
    }

    @Override
    protected void onCreate(Bundle savedInstanceState) {
        super.onCreate(savedInstanceState);
        getWindow().setFlags(WindowManager.LayoutParams.FLAG_SECURE, WindowManager.LayoutParams.FLAG_SECURE);

        web = new WebView(this);
        setContentView(web);

        WebSettings s = web.getSettings();
        s.setJavaScriptEnabled(true);
        s.setDomStorageEnabled(true);
        s.setAllowFileAccess(false);
        s.setAllowContentAccess(false);
        s.setMixedContentMode(WebSettings.MIXED_CONTENT_NEVER_ALLOW);
        s.setGeolocationEnabled(false);
        s.setSupportMultipleWindows(false);
        WebView.setWebContentsDebuggingEnabled(false);

        final WebViewAssetLoader loader = new WebViewAssetLoader.Builder()
                .setDomain(HOST)
                .addPathHandler("/assets/", new WebViewAssetLoader.AssetsPathHandler(this))
                .build();

        web.setWebViewClient(new WebViewClient() {
            @Override
            public WebResourceResponse shouldInterceptRequest(WebView view, WebResourceRequest request) {
                return loader.shouldInterceptRequest(request.getUrl());
            }

            @Override
            public boolean shouldOverrideUrlLoading(WebView view, WebResourceRequest request) {
                Uri u = request.getUrl();
                if (HOST.equals(u.getHost())) return false;
                if ("https".equals(u.getScheme())) {
                    try {
                        startActivity(new Intent(Intent.ACTION_VIEW, u));
                    } catch (Exception ignored) {
                        // tizim brauzeri topilmadi
                    }
                }
                return true;
            }
        });

        web.addJavascriptInterface(new Bridge(), "HamyonNative");
        web.loadUrl(HOME);
    }

    @Override
    public void onBackPressed() {
        if (web != null && web.canGoBack()) web.goBack();
        else super.onBackPressed();
    }

    @Override
    protected void onDestroy() {
        if (web != null) {
            web.removeJavascriptInterface("HamyonNative");
            web.destroy();
            web = null;
        }
        super.onDestroy();
    }

    /* ---------- veb sahifaga natija qaytarish ---------- */
    private void reply(final String cb, final boolean ok, final String payload) {
        final String js = "window.__hn&&window.__hn(" + JSONObject.quote(cb) + "," + ok + "," + JSONObject.quote(payload) + ")";
        runOnUiThread(new Runnable() {
            @Override
            public void run() {
                if (web != null) web.evaluateJavascript(js, null);
            }
        });
    }

    /* ---------- biometrik so'rov: kalit shifrlash obyekti bilan bog'langan ---------- */
    private void prompt(final String cb, final Cipher cipher, final Done done) {
        BiometricPrompt.AuthenticationCallback callback = new BiometricPrompt.AuthenticationCallback() {
            @Override
            public void onAuthenticationSucceeded(BiometricPrompt.AuthenticationResult result) {
                try {
                    done.run(result.getCryptoObject().getCipher());
                } catch (KeyPermanentlyInvalidatedException e) {
                    reply(cb, false, "INVALID");
                } catch (Exception e) {
                    reply(cb, false, "INVALID");
                }
            }

            @Override
            public void onAuthenticationError(int errorCode, CharSequence errString) {
                if (errorCode == BiometricPrompt.ERROR_USER_CANCELED
                        || errorCode == BiometricPrompt.ERROR_NEGATIVE_BUTTON
                        || errorCode == BiometricPrompt.ERROR_CANCELED) {
                    reply(cb, false, "CANCELED");
                } else if (errorCode == BiometricPrompt.ERROR_LOCKOUT
                        || errorCode == BiometricPrompt.ERROR_LOCKOUT_PERMANENT) {
                    reply(cb, false, "LOCKED");
                } else {
                    reply(cb, false, "FAIL");
                }
            }
        };
        BiometricPrompt bp = new BiometricPrompt(this, ContextCompat.getMainExecutor(this), callback);
        BiometricPrompt.PromptInfo info = new BiometricPrompt.PromptInfo.Builder()
                .setTitle("Mening hamyonim")
                .setSubtitle("Barmoq izi yoki yuzni tasdiqlang")
                .setNegativeButtonText("Bekor qilish")
                .setAllowedAuthenticators(BiometricManager.Authenticators.BIOMETRIC_STRONG)
                .build();
        bp.authenticate(info, new BiometricPrompt.CryptoObject(cipher));
    }

    private void doSeal(final String cb, final String plainB64) {
        try {
            final byte[] plain = Base64.decode(plainB64, Base64.NO_WRAP);
            KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
            ks.load(null);
            ks.deleteEntry(ALIAS);

            KeyGenParameterSpec.Builder kb = new KeyGenParameterSpec.Builder(
                    ALIAS, KeyProperties.PURPOSE_ENCRYPT | KeyProperties.PURPOSE_DECRYPT)
                    .setBlockModes(KeyProperties.BLOCK_MODE_GCM)
                    .setEncryptionPaddings(KeyProperties.ENCRYPTION_PADDING_NONE)
                    .setKeySize(256)
                    .setUserAuthenticationRequired(true)
                    .setInvalidatedByBiometricEnrollment(true);
            if (Build.VERSION.SDK_INT >= 30) {
                kb.setUserAuthenticationParameters(0, KeyProperties.AUTH_BIOMETRIC_STRONG);
            } else {
                kb.setUserAuthenticationValidityDurationSeconds(-1);
            }
            KeyGenerator kg = KeyGenerator.getInstance(KeyProperties.KEY_ALGORITHM_AES, "AndroidKeyStore");
            kg.init(kb.build());
            kg.generateKey();

            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.ENCRYPT_MODE, (SecretKey) ks.getKey(ALIAS, null));
            prompt(cb, cipher, new Done() {
                @Override
                public void run(Cipher c) throws Exception {
                    byte[] ct = c.doFinal(plain);
                    JSONObject o = new JSONObject();
                    o.put("iv", Base64.encodeToString(c.getIV(), Base64.NO_WRAP));
                    o.put("ct", Base64.encodeToString(ct, Base64.NO_WRAP));
                    reply(cb, true, o.toString());
                }
            });
        } catch (Exception e) {
            reply(cb, false, "UNAVAILABLE");
        }
    }

    private void doOpen(final String cb, String ivB64, final String ctB64) {
        try {
            KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
            ks.load(null);
            Key key = ks.getKey(ALIAS, null);
            if (key == null) {
                reply(cb, false, "INVALID");
                return;
            }
            byte[] iv = Base64.decode(ivB64, Base64.NO_WRAP);
            Cipher cipher = Cipher.getInstance("AES/GCM/NoPadding");
            cipher.init(Cipher.DECRYPT_MODE, key, new GCMParameterSpec(128, iv));
            prompt(cb, cipher, new Done() {
                @Override
                public void run(Cipher c) throws Exception {
                    byte[] plain = c.doFinal(Base64.decode(ctB64, Base64.NO_WRAP));
                    reply(cb, true, Base64.encodeToString(plain, Base64.NO_WRAP));
                }
            });
        } catch (KeyPermanentlyInvalidatedException e) {
            reply(cb, false, "INVALID");
        } catch (Exception e) {
            reply(cb, false, "INVALID");
        }
    }

    /* ---------- veb sahifaga ochiladigan yagona ko'prik (faqat o'z fayllarimiz yuklanadi) ---------- */
    public class Bridge {
        @JavascriptInterface
        public String avail() {
            try {
                int r = BiometricManager.from(MainActivity.this)
                        .canAuthenticate(BiometricManager.Authenticators.BIOMETRIC_STRONG);
                return r == BiometricManager.BIOMETRIC_SUCCESS ? "yes" : "no";
            } catch (Exception e) {
                return "no";
            }
        }

        @JavascriptInterface
        public void seal(final String cb, final String plainB64) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    doSeal(cb, plainB64);
                }
            });
        }

        @JavascriptInterface
        public void open(final String cb, final String iv, final String ct) {
            runOnUiThread(new Runnable() {
                @Override
                public void run() {
                    doOpen(cb, iv, ct);
                }
            });
        }

        @JavascriptInterface
        public void clear() {
            try {
                KeyStore ks = KeyStore.getInstance("AndroidKeyStore");
                ks.load(null);
                ks.deleteEntry(ALIAS);
            } catch (Exception ignored) {
                // kalit allaqachon yo'q
            }
        }
    }
}
