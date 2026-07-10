import React, { useState, useEffect } from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  StyleSheet, TextInput,
} from 'react-native';
import Slider from
  '@react-native-community/slider';

interface Props {
  visible: boolean;
  currentColor: string;
  onSelect: (hex: string) => void;
  onClose: () => void;
}

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

const PRESETS = [
  '#00F0FF', '#FF2D78', '#FF6B35',
  '#00FF88', '#B44FFF', '#FFD700',
  '#FF0000', '#00FF00', '#0000FF',
  '#FF00FF', '#FFFFFF', '#FFA500',
];

export default function ColorPickerModal({
  visible, currentColor, onSelect, onClose
}: Props) {
  const [hue, setHue] = useState(180);
  const [saturation, setSaturation] = useState(100);
  const [lightness, setLightness] = useState(50);
  const [hexInput, setHexInput] =
    useState(currentColor);

  const preview = hslToHex(hue, saturation, lightness);

  useEffect(() => {
    setHexInput(preview);
  }, [hue, saturation, lightness]);

  return (
    <Modal
      visible={visible}
      transparent
      animationType="slide"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.sheet}>
          <View style={styles.handlebar} />

          <Text style={styles.title}>
            ЦВЕТ АКЦЕНТА
          </Text>

          <View style={[
            styles.preview,
            { backgroundColor: preview }
          ]}>
            <Text style={styles.previewHex}>
              {preview.toUpperCase()}
            </Text>
          </View>

          <Text style={styles.sliderLabel}>
            ОТТЕНОК: {Math.round(hue)}°
          </Text>
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

          <Text style={styles.sliderLabel}>
            НАСЫЩЕННОСТЬ: {Math.round(saturation)}%
          </Text>
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

          <Text style={styles.sliderLabel}>
            ЯРКОСТЬ: {Math.round(lightness)}%
          </Text>
          <Slider
            minimumValue={10}
            maximumValue={90}
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
              style={[
                styles.hexInput,
                { borderColor: preview }
              ]}
            />
          </View>

          <Text style={styles.sliderLabel}>
            БЫСТРЫЙ ВЫБОР
          </Text>
          <View style={styles.presets}>
            {PRESETS.map(c => (
              <TouchableOpacity
                key={c}
                onPress={() => {
                  onSelect(c);
                  onClose();
                }}
                style={[
                  styles.presetDot,
                  { backgroundColor: c },
                  currentColor === c && {
                    transform: [{ scale: 1.3 }],
                    shadowColor: c,
                    shadowOpacity: 1,
                    shadowRadius: 8,
                    elevation: 8,
                  }
                ]}
              />
            ))}
          </View>

          <View style={styles.actions}>
            <TouchableOpacity
              style={[
                styles.applyBtn,
                { backgroundColor: preview }
              ]}
              onPress={() => {
                onSelect(preview);
                onClose();
              }}
            >
              <Text style={styles.applyText}>
                ПРИМЕНИТЬ
              </Text>
            </TouchableOpacity>
            <TouchableOpacity
              onPress={onClose}
              style={styles.cancelBtn}
            >
              <Text style={styles.cancelText}>
                ОТМЕНА
              </Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.85)',
    justifyContent: 'flex-end',
  },
  sheet: {
    backgroundColor: 'rgba(25,25,27,0.65)',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderBottomWidth: 0,
    padding: 24,
    paddingBottom: 40,
  },
  handlebar: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: 'rgba(255,255,255,0.15)',
    alignSelf: 'center',
    marginBottom: 16,
  },
  title: {
    color: '#606080',
    fontSize: 11,
    letterSpacing: 3,
    fontWeight: '600',
    marginBottom: 16,
    textAlign: 'center',
  },
  preview: {
    height: 64,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 20,
  },
  previewHex: {
    color: 'rgba(0,0,0,0.6)',
    fontSize: 18,
    fontWeight: '600',
    fontFamily: 'monospace',
  },
  sliderLabel: {
    color: '#404060',
    fontSize: 10,
    letterSpacing: 2,
    fontWeight: '600',
    marginBottom: 6,
  },
  slider: {
    width: '100%',
    height: 36,
    marginBottom: 12,
  },
  hexRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    marginBottom: 16,
  },
  hexLabel: {
    color: '#606080',
    fontSize: 12,
    fontWeight: '600',
    letterSpacing: 2,
  },
  hexInput: {
    flex: 1,
    backgroundColor: 'rgba(10,10,15,0.6)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    color: '#e0e0ff',
    fontSize: 15,
    fontFamily: 'monospace',
  },
  presets: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    marginBottom: 20,
  },
  presetDot: {
    width: 36,
    height: 36,
    borderRadius: 18,
  },
  actions: { gap: 10 },
  applyBtn: {
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: 'center',
  },
  applyText: {
    color: '#000',
    fontWeight: '600',
    fontSize: 14,
    letterSpacing: 2,
  },
  cancelBtn: {
    alignItems: 'center',
    paddingVertical: 10,
  },
  cancelText: {
    color: '#404060',
    fontSize: 14,
  },
});
