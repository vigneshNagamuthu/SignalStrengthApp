package com.signalstrengthapp
import android.Manifest
import android.annotation.SuppressLint
import android.content.pm.PackageManager
import com.facebook.react.bridge.*
import com.facebook.react.module.annotations.ReactModule
import com.google.android.gms.location.FusedLocationProviderClient
import com.google.android.gms.location.LocationServices
import androidx.core.app.ActivityCompat
import com.google.android.gms.tasks.OnSuccessListener
import com.google.android.gms.tasks.OnFailureListener
import android.location.Location

@ReactModule(name = LocationModule.NAME)
class LocationModule(private val reactContext: ReactApplicationContext) :
    ReactContextBaseJavaModule(reactContext) {

    companion object {
        const val NAME = "LocationModule"
    }

    private var fusedLocationClient: FusedLocationProviderClient = LocationServices.getFusedLocationProviderClient(reactContext)

    override fun getName(): String {
        return NAME
    }

    @SuppressLint("MissingPermission")
    @ReactMethod
    fun getLocation(promise: Promise) {
        if (ActivityCompat.checkSelfPermission(reactContext, Manifest.permission.ACCESS_FINE_LOCATION) != PackageManager.PERMISSION_GRANTED) {
            promise.reject("PERMISSION_DENIED", "Location permission not granted")
            return
        }

        fusedLocationClient.lastLocation
            .addOnSuccessListener(OnSuccessListener<Location> { location ->
                if (location != null) {
                    val locationMap = Arguments.createMap()
                    locationMap.putDouble("latitude", location.latitude)
                    locationMap.putDouble("longitude", location.longitude)
                    promise.resolve(locationMap)
                } else {
                    promise.reject("LOCATION_ERROR", "Location is null")
                }
            })
            .addOnFailureListener(OnFailureListener { e ->
                promise.reject("LOCATION_ERROR", e.message)
            })
    }
}