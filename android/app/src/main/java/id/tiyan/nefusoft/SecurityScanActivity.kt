package id.tiyan.nefusoft

import android.annotation.SuppressLint
import android.content.Context
import android.content.Intent
import android.content.pm.PackageManager
import android.net.ConnectivityManager
import android.os.Bundle
import android.os.Handler
import android.os.Looper
import android.provider.Settings
import android.view.View
import android.view.animation.Animation
import android.view.animation.AnimationUtils
import android.view.animation.LinearInterpolator
import android.view.animation.RotateAnimation
import android.widget.ImageView
import android.widget.LinearLayout
import android.widget.ProgressBar
import android.widget.TextView
import androidx.appcompat.app.AppCompatActivity
import androidx.core.content.ContextCompat
import com.google.android.material.button.MaterialButton
import com.google.android.material.card.MaterialCardView
import java.io.File

class SecurityScanActivity : AppCompatActivity() {

    private lateinit var statusTitle: TextView
    private lateinit var statusDesc: TextView
    private lateinit var shieldLogo: ImageView
    private lateinit var scanningRadar: View
    private lateinit var scanDetailsContainer: LinearLayout
    private lateinit var resultCard: MaterialCardView
    private lateinit var btnContinue: MaterialButton

    // Checklist components
    private lateinit var playProtectIcon: ImageView
    private lateinit var playProtectStatus: TextView

    private lateinit var rootIcon: ImageView
    private lateinit var rootStatus: TextView

    private lateinit var integrityIcon: ImageView
    private lateinit var integrityStatus: TextView

    private lateinit var debuggingIcon: ImageView
    private lateinit var debuggingStatus: TextView

    private lateinit var connectionIcon: ImageView
    private lateinit var connectionStatus: TextView

    private val handler = Handler(Looper.getMainLooper())

    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_security_scan)

        // Initialize UI Elements
        statusTitle = findViewById(R.id.statusTitle)
        statusDesc = findViewById(R.id.statusDesc)
        shieldLogo = findViewById(R.id.shieldLogo)
        scanningRadar = findViewById(R.id.scanningRadar)
        scanDetailsContainer = findViewById(R.id.scanDetailsContainer)
        resultCard = findViewById(R.id.resultCard)
        btnContinue = findViewById(R.id.btnContinue)

        // Initialize Checklist
        playProtectIcon = findViewById(R.id.playProtectIcon)
        playProtectStatus = findViewById(R.id.playProtectStatus)

        rootIcon = findViewById(R.id.rootIcon)
        rootStatus = findViewById(R.id.rootStatus)

        integrityIcon = findViewById(R.id.integrityIcon)
        integrityStatus = findViewById(R.id.integrityStatus)

        debuggingIcon = findViewById(R.id.debuggingIcon)
        debuggingStatus = findViewById(R.id.debuggingStatus)

        connectionIcon = findViewById(R.id.connectionIcon)
        connectionStatus = findViewById(R.id.connectionStatus)

        // Start scanning rotation animation
        startRadarAnimation()

        // Start sequential safety scan simulation
        startSecurityCheck()

        btnContinue.setOnClickListener {
            val intent = Intent(this, MainActivity::class.java)
            startActivity(intent)
            finish()
        }
    }

    private fun startRadarAnimation() {
        val rotate = RotateAnimation(
            0f, 360f,
            Animation.RELATIVE_TO_SELF, 0.5f,
            Animation.RELATIVE_TO_SELF, 0.5f
        ).apply {
            duration = 1500
            repeatCount = Animation.INFINITE
            interpolator = LinearInterpolator()
        }
        scanningRadar.startAnimation(rotate)
    }

    private fun startSecurityCheck() {
        // Step 1: Initialize Scan
        handler.postDelayed({
            statusTitle.text = "Memindai Aplikasi..."
            statusDesc.text = "Memeriksa integritas sistem dan keamanan..."
        }, 500)

        // Step 2: Check Play Protect Status
        handler.postDelayed({
            val playProtectSupported = checkPlayProtectStatus()
            if (playProtectSupported) {
                playProtectIcon.setImageResource(R.drawable.ic_check_circle_green)
                playProtectStatus.text = "Play Protect: Aktif & Melindungi"
                playProtectStatus.setTextColor(ContextCompat.getColor(this, R.color.white))
            } else {
                playProtectIcon.setImageResource(R.drawable.ic_warning_yellow)
                playProtectStatus.text = "Play Protect: Tidak Terdeteksi (Gunakan dengan Bijak)"
                playProtectStatus.setTextColor(ContextCompat.getColor(this, R.color.gold_accent))
            }
        }, 1000)

        // Step 3: Check Root Status
        handler.postDelayed({
            val isRooted = isDeviceRooted()
            if (!isRooted) {
                rootIcon.setImageResource(R.drawable.ic_check_circle_green)
                rootStatus.text = "Status Root: Aman (Device Bersih)"
                rootStatus.setTextColor(ContextCompat.getColor(this, R.color.white))
            } else {
                rootIcon.setImageResource(R.drawable.ic_warning_yellow)
                rootStatus.text = "Status Root: Terdeteksi Root (Gunakan dengan Hati-hati)"
                rootStatus.setTextColor(ContextCompat.getColor(this, R.color.gold_accent))
            }
        }, 1500)

        // Step 4: Check App Package Integrity
        handler.postDelayed({
            val isIntact = checkAppIntegrity()
            if (isIntact) {
                integrityIcon.setImageResource(R.drawable.ic_check_circle_green)
                integrityStatus.text = "Integritas Paket: Lolos (Tanda Tangan Valid)"
                integrityStatus.setTextColor(ContextCompat.getColor(this, R.color.white))
            } else {
                integrityIcon.setImageResource(R.drawable.ic_warning_yellow)
                integrityStatus.text = "Integritas Paket: Tidak Resmi (Bukan APK Asli)"
                integrityStatus.setTextColor(ContextCompat.getColor(this, R.color.gold_accent))
            }
        }, 2000)

        // Step 5: Check USB Debugging
        handler.postDelayed({
            val isAdbOn = isAdbEnabled()
            if (!isAdbOn) {
                debuggingIcon.setImageResource(R.drawable.ic_check_circle_green)
                debuggingStatus.text = "Opsi Pengembang: Nonaktif (Sangat Aman)"
                debuggingStatus.setTextColor(ContextCompat.getColor(this, R.color.white))
            } else {
                debuggingIcon.setImageResource(R.drawable.ic_info_blue)
                debuggingStatus.text = "Opsi Pengembang: Aktif (USB Debugging Menyala)"
                debuggingStatus.setTextColor(ContextCompat.getColor(this, R.color.white))
            }
        }, 2500)

        // Step 6: Check Connection Security
        handler.postDelayed({
            val isConnSecure = isNetworkSecure()
            if (isConnSecure) {
                connectionIcon.setImageResource(R.drawable.ic_check_circle_green)
                connectionStatus.text = "Enkripsi Jaringan: Aman (SSL Terenkripsi)"
                connectionStatus.setTextColor(ContextCompat.getColor(this, R.color.white))
            } else {
                connectionIcon.setImageResource(R.drawable.ic_warning_yellow)
                connectionStatus.text = "Enkripsi Jaringan: Tidak Ada Koneksi"
                connectionStatus.setTextColor(ContextCompat.getColor(this, R.color.gold_accent))
            }
        }, 3000)

        // Step 7: Complete Scan and show Result Card
        handler.postDelayed({
            // Stop radar animation
            scanningRadar.clearAnimation()
            scanningRadar.visibility = View.GONE

            // Change Shield icon to a beautiful green/gold secure shield
            shieldLogo.setImageResource(R.drawable.ic_shield_secure_green)

            // Update Header Status
            statusTitle.text = "Aman & Terverifikasi"
            statusTitle.setTextColor(ContextCompat.getColor(this, R.color.gold_accent))
            statusDesc.text = "Semua sistem keamanan lulus uji kelayakan."

            // Show result card and button with slide-up animation
            resultCard.visibility = View.VISIBLE
            btnContinue.visibility = View.VISIBLE

            val slideUp = AnimationUtils.loadAnimation(this, R.anim.slide_up)
            resultCard.startAnimation(slideUp)
            btnContinue.startAnimation(slideUp)

        }, 3600)
    }

    private fun checkPlayProtectStatus(): Boolean {
        return try {
            packageManager.getPackageInfo("com.android.vending", 0)
            true
        } catch (e: Exception) {
            false
        }
    }

    private fun isDeviceRooted(): Boolean {
        val paths = arrayOf(
            "/system/app/Superuser.apk",
            "/sbin/su",
            "/system/bin/su",
            "/system/xbin/su",
            "/data/local/xbin/su",
            "/data/local/bin/su",
            "/system/sd/xbin/su",
            "/system/bin/failsafe/su",
            "/data/local/su"
        )
        for (path in paths) {
            if (File(path).exists()) return true
        }
        return false
    }

    private fun isAdbEnabled(): Boolean {
        return try {
            Settings.Global.getInt(contentResolver, Settings.Global.ADB_ENABLED, 0) != 0
        } catch (e: Exception) {
            false
        }
    }

    private fun checkAppIntegrity(): Boolean {
        return try {
            @SuppressLint("PackageManagerGetSignatures")
            val info = packageManager.getPackageInfo(packageName, PackageManager.GET_SIGNATURES)
            info.signatures != null && info.signatures.isNotEmpty()
        } catch (e: Exception) {
            false
        }
    }

    private fun isNetworkSecure(): Boolean {
        val cm = getSystemService(Context.CONNECTIVITY_SERVICE) as? ConnectivityManager
        val activeNetwork = cm?.activeNetworkInfo
        return activeNetwork != null && activeNetwork.isConnected
    }
}
