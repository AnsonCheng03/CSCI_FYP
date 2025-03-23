import * as React from "react";
import { useState, useEffect } from "react";
import { ThemedText } from "@/components/ThemedText";
import { ThemedView } from "@/components/ThemedView";
import {
  TextInput,
  Button,
  StyleSheet,
  ScrollView,
  Platform,
} from "react-native";
import { RouteProp, useRoute } from "@react-navigation/native";
import { BleService } from "../../Services/BleService";
import { Device } from "react-native-ble-plx";
import { SafeAreaProvider } from "react-native-safe-area-context";
import DocumentPicker from "react-native-document-picker";
import RNFS from "react-native-fs"; // Add if using file system

export default function ScoreTabScreen() {
  const route = useRoute();
  const [command, setCommand] = useState<string>("");
  const [receivedCommands, setReceivedCommands] = useState<string[]>([]);
  const [isConnected, setIsConnected] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);

  const { device } = (route.params || {}) as { device: Device };
  const bleService = BleService.getInstance();

  const returnFilePath = (fileName: string) => {
    const dirPath =
      Platform.OS === "ios"
        ? `${RNFS.DocumentDirectoryPath}`
        : `${RNFS.DownloadDirectoryPath}`;
    return dirPath + `/${fileName}`;
  };

  const connectToDevice = () => {
    setLoading(true);
    bleService
      .connectToDevice(device)
      .then(() => {
        setIsConnected(true);
      })
      .catch((error: Error) => {
        console.error(error.message);
        setIsConnected(false);
      })
      .finally(() => {
        setLoading(false);
      });
  };

  useEffect(() => {
    if (device) {
      connectToDevice();
    }
  }, [device]);

  useEffect(() => {
    return () => {
      console.log("Cleaning up PlayTabScreen");
      if (isConnected && device) {
        console.log("Disconnecting from device");
        device.cancelConnection();
      }
    };
  }, [isConnected]);

  const sendCommand = () => {
    if (!isConnected) return;

    bleService
      .sendCommandToDevice(device, command)
      .then(() => {
        setReceivedCommands((prevCommands) => [...prevCommands, command]);
      })
      .catch((error: Error) => {
        console.error(error.message);
        setIsConnected(false);
      });
  };

  return (
    <SafeAreaProvider>
      <ThemedView style={styles.container}>
        <ThemedText style={styles.title}>
          {`Controlling Device: ${device?.name || "Unknown"}`}
        </ThemedText>
        <ThemedText
          style={styles.text}
        >{`Device ID: ${device?.id}`}</ThemedText>
        {loading ? (
          <ThemedText style={styles.loadingText}>Connecting...</ThemedText>
        ) : isConnected ? (
          <ThemedView>
            <TextInput
              style={styles.textInput}
              placeholder="Enter command"
              value={command}
              onChangeText={setCommand}
            />
            <Button title="Send Command" onPress={sendCommand} />
            <ScrollView style={styles.commandBox}>
              <ThemedText style={styles.commandTitle}>
                Commands Received:
              </ThemedText>
              {receivedCommands.map((cmd, index) => (
                <ThemedText key={index} style={styles.commandText}>
                  {cmd}
                </ThemedText>
              ))}
            </ScrollView>
            <Button
              title="Upload File"
              onPress={() => {
                DocumentPicker.pick({
                  type: [DocumentPicker.types.allFiles],
                  allowMultiSelection: false,
                })
                  .then(async (res) => {
                    for (const file of res) {
                      if (!file.uri) {
                        console.log("No file uri found");
                        continue;
                      }

                      bleService
                        .sendFileToDevice(device, file.uri)
                        .then(() => {
                          setReceivedCommands((prevCommands) => [
                            ...prevCommands,
                            "File sent",
                          ]);
                        })
                        .catch((error: Error) => {
                          console.error(error.message);
                          setIsConnected(false);
                        });
                    }
                  })
                  .catch((err: any) => {
                    console.log("File Selection Err:", err);
                  });
              }}
            />
          </ThemedView>
        ) : (
          <ThemedView>
            <ThemedText style={styles.errorText}>
              Failed to connect to device
            </ThemedText>
            <Button title="Retry" onPress={connectToDevice} />
          </ThemedView>
        )}
      </ThemedView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 24,
    fontWeight: "bold",
    margin: 20,
  },
  text: {
    margin: 5,
  },
  textInput: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    margin: 20,
    width: "80%",
    paddingHorizontal: 10,
  },
  commandBox: {
    marginTop: 20,
    width: "80%",
    maxHeight: 200,
    borderColor: "gray",
    borderWidth: 1,
    padding: 10,
  },
  commandTitle: {
    fontWeight: "bold",
    margin: 10,
  },
  commandText: {
    fontSize: 16,
    margin: 5,
  },
  loadingText: {
    fontSize: 18,
    margin: 20,
  },
  errorText: {
    fontSize: 18,
    color: "gray",
  },
});
