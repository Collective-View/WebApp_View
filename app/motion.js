import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet } from "react-native";
import { DeviceMotion } from "expo-sensors";

export default function MotionScreen() {
  const [motion, setMotion] = useState({});

  useEffect(() => {
    const subscription = DeviceMotion.addListener((data) => setMotion(data));
    DeviceMotion.setUpdateInterval(100);

    return () => subscription.remove();
  }, []);

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Datos del sensor:</Text>
      <Text>X: {motion.rotationRate?.alpha?.toFixed(2)}</Text>
      <Text>Y: {motion.rotationRate?.beta?.toFixed(2)}</Text>
      <Text>Z: {motion.rotationRate?.gamma?.toFixed(2)}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 18, marginBottom: 10 },
});
