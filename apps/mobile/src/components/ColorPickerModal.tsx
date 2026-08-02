import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useImageUpload } from "../hooks/useImageUpload";

const PRESET_COLORS = [
  "#000000", "#111111", "#222222", "#333333",
  "#444444", "#555555", "#666666", "#777777",
  "#888888", "#999999", "#aaaaaa", "#bbbbbb",
  "#ffffff", "#f5f5f5", "#eeeeee", "#dddddd",
  "#cccccc", "#fff8e1", "#fff3e0", "#f3e5f5",
  "#ffb3ba", "#ffdfba", "#ffffba", "#baffc9",
  "#bae1ff", "#d4b3ff", "#ffc8dd", "#c8e6c9",
  "#ffe082", "#b3e5fc", "#f8bbd0", "#dcedc8",
  "#ff0000", "#ff6600", "#ff9900", "#ffff00",
  "#66ff00", "#00ff00", "#00ffcc", "#00ffff",
  "#0066ff", "#0000ff", "#6600ff", "#cc00ff",
  "#ff00ff", "#ff0066", "#00cc66", "#33ccff",
  "#4a0000", "#4a1a00", "#4a4a00", "#004a00",
  "#003333", "#001a4a", "#00004a", "#2a004a",
  "#4a004a", "#4a0020", "#1a3300", "#003333",
  "#2e2e2e", "#3a3a3a", "#464646", "#525252",
  "#5e5e5e", "#6a6a6a", "#767676", "#828282",
];

type ColorPickerMode = "background" | "text";

interface ColorPickerModalProps {
  visible: boolean;
  initialColor: string;
  allowImage?: boolean;
  mode?: ColorPickerMode;
  onModeChange?: (mode: ColorPickerMode) => void;
  onClose: (value: string, kind?: "color" | "image" | "text") => void;
}

export default function ColorPickerModal({
  visible,
  initialColor,
  allowImage = false,
  mode = "background",
  onModeChange,
  onClose,
}: ColorPickerModalProps) {
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const { pickAndUploadImage, isUploading, error } = useImageUpload();

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onClose(color, mode === "text" ? "text" : "color");
  };

  const handleUploadPhoto = async () => {
    try {
      const url = await pickAndUploadImage("chat_wallpaper");
      onClose(url, "image");
    } catch {
      // error state is handled by the hook and displayed below
    }
  };

  const title = mode === "text" ? "Цвет текста" : "Цвет фона";

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>{title}</Text>
          {onModeChange && (
            <View style={styles.modeSwitch}>
              <TouchableOpacity
                style={[styles.modeBtn, mode === "background" && styles.modeBtnActive]}
                onPress={() => onModeChange("background")}
              >
                <Text style={[styles.modeBtnText, mode === "background" && styles.modeBtnTextActive]}>
                  Фон
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === "text" && styles.modeBtnActive]}
                onPress={() => onModeChange("text")}
              >
                <Text style={[styles.modeBtnText, mode === "text" && styles.modeBtnTextActive]}>
                  Текст
                </Text>
              </TouchableOpacity>
            </View>
          )}
          <View style={styles.colorGrid}>
            {PRESET_COLORS.map((color) => (
              <TouchableOpacity
                key={color}
                style={[styles.colorOption, { backgroundColor: color }]}
                onPress={() => handleColorSelect(color)}
              />
            ))}
          </View>
          {allowImage && (
            <TouchableOpacity
              style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
              onPress={handleUploadPhoto}
              disabled={isUploading}
            >
              {isUploading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.uploadButtonText}>Загрузить фото</Text>
              )}
            </TouchableOpacity>
          )}
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
          <TouchableOpacity style={styles.closeButton} onPress={() => onClose(selectedColor, mode === "text" ? "text" : "color")}>
            <Text style={styles.closeText}>Закрыть</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.7)",
    justifyContent: "center",
    alignItems: "center",
  },
  modalContainer: {
    backgroundColor: "#1a1a1a",
    borderRadius: 12,
    padding: 20,
    width: "90%",
    maxWidth: 400,
  },
  title: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
  },
  modeSwitch: {
    flexDirection: "row",
    backgroundColor: "#2a2a2a",
    borderRadius: 8,
    marginBottom: 16,
    overflow: "hidden",
  },
  modeBtn: {
    flex: 1,
    paddingVertical: 8,
    alignItems: "center",
  },
  modeBtnActive: {
    backgroundColor: "#4a5568",
  },
  modeBtnText: {
    color: "#888888",
    fontSize: 14,
    fontWeight: "600",
  },
  modeBtnTextActive: {
    color: "#ffffff",
  },
  colorGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "center",
    gap: 8,
    marginBottom: 16,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#333333",
  },
  uploadButton: {
    backgroundColor: "#4a5568",
    padding: 12,
    borderRadius: 6,
    alignItems: "center",
    marginBottom: 10,
  },
  uploadButtonDisabled: {
    opacity: 0.6,
  },
  uploadButtonText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
  errorText: {
    color: "#ff6b6b",
    fontSize: 12,
    textAlign: "center",
    marginBottom: 10,
  },
  closeButton: {
    backgroundColor: "#333333",
    padding: 10,
    borderRadius: 6,
    alignItems: "center",
  },
  closeText: {
    color: "#ffffff",
    fontSize: 14,
    fontWeight: "bold",
  },
});
