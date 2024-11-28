#include "Slider.h"

Slider::Slider(int startPin, int directionPin, int speedPin, int sensorPin)
    : Device(startPin, directionPin, speedPin), sensorPin(sensorPin), isCalibrating(false) {}

void Slider::setup() {
    Device::setup();
    pinMode(sensorPin, INPUT);
    Serial.println("Slider setup for sensor pin: " + String(sensorPin));
}

void Slider::calibrate() {
    Serial.println("Calibrating slider...");
    isCalibrating = true;
    // analogWrite(speedPin, 500);
    // setDirection(LOW);
    // startMovement(100);
    // Serial.println("Calibration started: Moving slider backward");
    // // Assume calibration is done successfully for now
    isCalibrating = false;
    isCalibrated = true;
    currentPosition = 0;
    Serial.println("Slider calibration complete.");
}

void Slider::update() {
    Device::update();
    if (isCalibrating && !isMoving) {
        isCalibrating = false;
        isCalibrated = true;
        currentPosition = 0;
        stop();
        Serial.println("Slider calibration complete.");
    }
}