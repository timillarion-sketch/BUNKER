import { useState } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from "react-native";
import { useImageUpload } from "../hooks/useImageUpload";

const PRESET_COLORS = [
  "#000000", "#1a1a1a", "#333333", "#4d4d4d",
  "#666666", "#808080", "#999999", "#b3b3b3",
  "#cccccc", "#e6e6e6", "#ffffff",
  "#ff0000", "#ff3333", "#ff6666", "#ff9999",
  "#ffcccc", "#00ff00", "#33ff33", "#66ff66",
  "#99ff99", "#00ffff", "#33ffff", "#66ffff",
  "#99ffff", "#0000ff", "#3333ff", "#6666ff",
  "#9999ff", "#cc99ff", "#ff00ff", "#ff33ff",
];

interface ColorPickerModalProps {
  visible: boolean;
  initialColor: string;
  allowImage?: boolean;
  onClose: (value: string, kind?: "color" | "image") => void;
}

export default function ColorPickerModal({ visible, initialColor, allowImage = false, onClose }: ColorPickerModalProps) {
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const { pickAndUploadImage, isUploading, error } = useImageUpload();

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onClose(color, "color");
  };

  const handleUploadPhoto = async () => {
    try {
      const url = await pickAndUploadImage("chat_wallpaper");
      onClose(url, "image");
    } catch {
      // error state is handled by the hook and displayed below
    }
  };

  return (
    <Modal visible={visible} transparent animationType="slide">
      <View style={styles.overlay}>
        <View style={styles.modalContainer}>
          <Text style={styles.title}>Выберите цвет</Text>
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
          <TouchableOpacity style={styles.closeButton} onPress={() => onClose(selectedColor, "color")}>
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
