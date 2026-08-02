import { useState, useEffect } from "react";
import { Modal, View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, TextInput } from "react-native";
import Slider from "@react-native-community/slider";
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

const RAINBOW_STRIPES = [
  "#ff0000", "#ff8800", "#ffff00", "#00cc00", "#00ccff", "#2200ff", "#8800ff",
];

function hslToHex(h: number, s: number, l: number): string {
  s /= 100; l /= 100;
  const a = s * Math.min(l, 1 - l);
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const color = l - a * Math.max(
      Math.min(k - 3, 9 - k, 1), -1
    );
    return Math.round(255 * color)
      .toString(16).padStart(2, '0');
  };
  return `#${f(0)}${f(8)}${f(4)}`;
}

function hexToHsl(hex: string): { h: number; s: number; l: number } {
  const r = parseInt(hex.slice(1, 3), 16) / 255;
  const g = parseInt(hex.slice(3, 5), 16) / 255;
  const b = parseInt(hex.slice(5, 7), 16) / 255;
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  let h = 0, s = 0;
  const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    switch (max) {
      case r: h = ((g - b) / d + (g < b ? 6 : 0)) / 6; break;
      case g: h = ((b - r) / d + 2) / 6; break;
      case b: h = ((r - g) / d + 4) / 6; break;
    }
  }
  return {
    h: Math.round(h * 360),
    s: Math.round(s * 100),
    l: Math.round(l * 100),
  };
}

type ColorPickerMode = "background" | "ownText" | "peerText";
type ColorPickerKind = "color" | "image" | "ownText" | "peerText";

interface ColorPickerModalProps {
  visible: boolean;
  initialColor: string;
  allowImage?: boolean;
  mode?: ColorPickerMode;
  onModeChange?: (mode: ColorPickerMode) => void;
  onClose: (value: string, kind?: ColorPickerKind) => void;
  peerTextLabel?: string;
}

export default function ColorPickerModal({
  visible,
  initialColor,
  allowImage = false,
  mode = "background",
  onModeChange,
  onClose,
  peerTextLabel = "Сообщения собеседника",
}: ColorPickerModalProps) {
  const [selectedColor, setSelectedColor] = useState(initialColor);
  const { pickAndUploadImage, isUploading, error } = useImageUpload();
  const [showCustom, setShowCustom] = useState(false);
  const [hue, setHue] = useState(180);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [hexInput, setHexInput] = useState(initialColor);

  const preview = hslToHex(hue, saturation, lightness);

  useEffect(() => {
    setHexInput(preview);
  }, [hue, saturation, lightness]);

  const openCustom = () => {
    const { h, s, l } = hexToHsl(initialColor);
    setHue(h);
    setSaturation(s);
    setLightness(l);
    setHexInput(initialColor);
    setShowCustom(true);
  };

  const applyCustom = () => {
    onClose(preview, mode === "background" ? "color" : mode);
    setShowCustom(false);
  };

  const handleColorSelect = (color: string) => {
    setSelectedColor(color);
    onClose(color, mode === "background" ? "color" : mode);
  };

  const handleUploadPhoto = async () => {
    try {
      const url = await pickAndUploadImage("chat_wallpaper");
      onClose(url, "image");
    } catch {
      // error state is handled by the hook and displayed below
    }
  };

  const title =
    mode === "background" ? "Цвет фона" :
    mode === "ownText" ? "Цвет моих сообщений" :
    `Цвет текста: ${peerTextLabel}`;

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
                style={[styles.modeBtn, mode === "ownText" && styles.modeBtnActive]}
                onPress={() => onModeChange("ownText")}
              >
                <Text style={[styles.modeBtnText, mode === "ownText" && styles.modeBtnTextActive]}>
                  Мои сообщения
                </Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[styles.modeBtn, mode === "peerText" && styles.modeBtnActive]}
                onPress={() => onModeChange("peerText")}
              >
                <Text style={[styles.modeBtnText, mode === "peerText" && styles.modeBtnTextActive]}>
                  {peerTextLabel}
                </Text>
              </TouchableOpacity>
            </View>
          )}
          {showCustom ? (
            <View>
              <TouchableOpacity style={styles.backButton} onPress={() => setShowCustom(false)}>
                <Text style={styles.backText}>← Палитра</Text>
              </TouchableOpacity>
              <View style={[styles.preview, { backgroundColor: preview }]}>
                <Text style={styles.previewHex}>{preview.toUpperCase()}</Text>
              </View>
              <Text style={styles.sliderLabel}>ОТТЕНОК: {Math.round(hue)}°</Text>
              <Slider
                minimumValue={0}
                maximumValue={360}
                value={hue}
                onValueChange={setHue}
                minimumTrackTintColor={preview}
                maximumTrackTintColor="rgba(255,255,255,0.08)"
                thumbTintColor={preview}
                style={styles.slider}
              />
              <Text style={styles.sliderLabel}>НАСЫЩЕННОСТЬ: {Math.round(saturation)}%</Text>
              <Slider
                minimumValue={0}
                maximumValue={100}
                value={saturation}
                onValueChange={setSaturation}
                minimumTrackTintColor={preview}
                maximumTrackTintColor="rgba(255,255,255,0.08)"
                thumbTintColor={preview}
                style={styles.slider}
              />
              <Text style={styles.sliderLabel}>ЯРКОСТЬ: {Math.round(lightness)}%</Text>
              <Slider
                minimumValue={0}
                maximumValue={100}
                value={lightness}
                onValueChange={setLightness}
                minimumTrackTintColor={preview}
                maximumTrackTintColor="rgba(255,255,255,0.08)"
                thumbTintColor={preview}
                style={styles.slider}
              />
              <View style={styles.hexRow}>
                <Text style={styles.hexLabel}>HEX</Text>
                <TextInput
                  value={hexInput}
                  onChangeText={(text) => {
                    setHexInput(text);
                    if (text.match(/^#[0-9A-Fa-f]{6}$/)) {
                      const { h, s, l } = hexToHsl(text);
                      setHue(h);
                      setSaturation(s);
                      setLightness(l);
                    }
                  }}
                  placeholder="#000000"
                  placeholderTextColor="#404060"
                  autoCapitalize="characters"
                  maxLength={7}
                  style={[styles.hexInput, { borderColor: preview }]}
                />
              </View>
              <TouchableOpacity
                style={[styles.applyButton, { backgroundColor: preview }]}
                onPress={applyCustom}
              >
                <Text style={styles.applyText}>Применить</Text>
              </TouchableOpacity>
            </View>
          ) : (
            <>
              <View style={styles.colorGrid}>
                {PRESET_COLORS.map((color) => (
                  <TouchableOpacity
                    key={color}
                    style={[styles.colorOption, { backgroundColor: color }]}
                    onPress={() => handleColorSelect(color)}
                  />
                ))}
                <View style={styles.customTileWrap}>
                  <TouchableOpacity style={styles.customTile} onPress={openCustom}>
                    <View style={styles.rainbowStripes}>
                      {RAINBOW_STRIPES.map((c) => (
                        <View key={c} style={[styles.rainbowStripe, { backgroundColor: c }]} />
                      ))}
                    </View>
                  </TouchableOpacity>
                  <Text style={styles.customTileLabel}>Свой цвет</Text>
                </View>
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
              <TouchableOpacity style={styles.closeButton} onPress={() => onClose(selectedColor, mode === "background" ? "color" : mode)}>
                <Text style={styles.closeText}>Закрыть</Text>
              </TouchableOpacity>
            </>
          )}
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
  customTileWrap: {
    alignItems: "center",
    gap: 4,
  },
  customTile: {
    width: 36,
    height: 36,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: "#333333",
    overflow: "hidden",
  },
  rainbowStripes: {
    flex: 1,
    flexDirection: "row",
  },
  rainbowStripe: {
    flex: 1,
  },
  customTileLabel: {
    color: "#888888",
    fontSize: 9,
  },
  backButton: {
    alignSelf: "flex-start",
    marginBottom: 12,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: 6,
    backgroundColor: "#2a2a2a",
  },
  backText: {
    color: "#aaaaaa",
    fontSize: 13,
    fontWeight: "600",
  },
  preview: {
    borderRadius: 8,
    paddingVertical: 18,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 14,
  },
  previewHex: {
    color: "#ffffff",
    fontSize: 16,
    fontWeight: "bold",
    textShadowColor: "rgba(0,0,0,0.8)",
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  sliderLabel: {
    color: "#888888",
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 1,
    marginBottom: 4,
  },
  slider: {
    width: "100%",
    height: 32,
    marginBottom: 8,
  },
  hexRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    marginBottom: 12,
  },
  hexLabel: {
    color: "#888888",
    fontSize: 12,
    fontWeight: "700",
    letterSpacing: 1,
  },
  hexInput: {
    flex: 1,
    backgroundColor: "#222222",
    borderRadius: 6,
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 6,
    color: "#ffffff",
    fontFamily: "monospace",
    fontSize: 14,
  },
  applyButton: {
    borderRadius: 6,
    paddingVertical: 12,
    alignItems: "center",
  },
  applyText: {
    color: "#000000",
    fontSize: 14,
    fontWeight: "bold",
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
