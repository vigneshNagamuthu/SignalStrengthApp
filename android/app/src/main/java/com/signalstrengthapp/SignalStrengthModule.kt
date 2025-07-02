package com.signalstrengthapp

import android.Manifest
import android.content.pm.PackageManager
import android.os.Build
import android.telephony.*
import androidx.core.app.ActivityCompat
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule

@ReactModule(name = SignalStrengthModule.NAME)
class SignalStrengthModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "SignalStrength"
    }

    override fun getName(): String {
        return NAME
    }

    @ReactMethod
    fun getSignalStrength(promise: Promise) {
        try {
            val telephonyManager = reactContext.getSystemService(ReactApplicationContext.TELEPHONY_SERVICE) as TelephonyManager

            if (ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
                promise.reject("PERMISSION_DENIED", "Location permission not granted")
                return
            }

            val cellInfoList = telephonyManager.allCellInfo
            val resultArray = Arguments.createArray()

            for (cellInfo in cellInfoList) {
                val cellMap = Arguments.createMap()
                when (cellInfo) {
                    is CellInfoLte -> {
                        val signal = cellInfo.cellSignalStrength
                        cellMap.putString("type", "LTE")
                        cellMap.putInt("rsrp", signal.rsrp)
                        cellMap.putInt("rsrq", signal.rsrq)
                        cellMap.putInt("rssnr", signal.rssnr)
                        cellMap.putInt("dbm", signal.dbm)
                    }
                    is CellInfoNr -> {
                        val signal = cellInfo.cellSignalStrength as CellSignalStrengthNr
                        cellMap.putString("type", "NR")
                        cellMap.putInt("ssRsrp", signal.ssRsrp)
                        cellMap.putInt("ssRsrq", signal.ssRsrq)
                        cellMap.putInt("ssSinr", signal.ssSinr)
                        cellMap.putInt("csiRsrp", signal.csiRsrp)
                    }
                }
                resultArray.pushMap(cellMap)
            }

            promise.resolve(resultArray)
        } catch (e: Exception) {
            promise.reject("ERROR", e.message)
        }
    }
}