import React, { useState, useEffect } from 'react';
import {
  View, Text, TouchableOpacity,
  StyleSheet, Alert,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useAccent } from '../core/AccentContext';
import { isPinSet, setPin, verifyPin } from '../services/SecretPinService';

interface Props {
  onSuccess: () => void;
  onCancel: () => void;
}

type PinStep = 'check' | 'create' | 'confirm' | 'enter';

export default function SecretPinScreen({ onSuccess, onCancel }: Props) {
  const { accent } = useAccent();
  const insets = useSafeAreaInsets();
  const [pinExists, setPinExists] = useState(false);
  const [input, setInput] = useState('');
  const [firstPin, setFirstPin] = useState('');
  const [step, setStep] = useState<PinStep>('check');

  useEffect(() => {
    isPinSet().then(exists => {
      setPinExists(exists);
      setStep(exists ? 'enter' : 'create');
    });
  }, []);

  const handleDigit = (d: string) => {
    if (step === 'enter' && pinExists) {
      const next = input + d;
      if (next.length > 4) return;
      setInput(next);
      if (next.length === 4) {
        verifyPin(next).then(ok => {
          if (ok) {
            onSuccess();
          } else {
            setInput('');
            Alert.alert('Неверный PIN');
          }
        });
      }
    }
  };

  const handleCreateDigit = (d: string) => {
    const next = input + d;
    if (next.length > 4) return;
    setInput(next);

    if (next.length < 4) return;

    if (step === 'create') {
      setFirstPin(next);
      setInput('');
      setStep('confirm');
    } else if (step === 'confirm') {
      if (next === firstPin) {
        setPin(next).then(() => {
          Alert.alert('PIN установлен', 'Запомни его — восстановление невозможно', [
            { text: 'OK', onPress: onSuccess },
          ]);
        });
      } else {
        setInput('');
        setFirstPin('');
        setStep('create');
        Alert.alert('PIN не совпадает', 'Попробуй снова');
      }
    }
  };

  const pressKey = (k: string) => {
    if (k === '⌫') {
      setInput(prev => prev.slice(0, -1));
      return;
    }
    if (step === 'enter') {
      handleDigit(k);
    } else {
      handleCreateDigit(k);
    }
  };

  const titles: Record<PinStep, string> = {
    check: 'Проверка...',
    create: 'Создай PIN-код',
    confirm: 'Повтори PIN-код',
    enter: 'Введи PIN-код',
  };

  const dots = [0, 1, 2, 3].map(i => (
    <View
      key={i}
      style={[
        styles.dot,
        {
          backgroundColor: i < input.length ? accent : '#1e1e2e',
          borderColor: accent,
        },
      ]}
    />
  ));

  const keys: string[][] = [
    ['1', '2', '3'],
    ['4', '5', '6'],
    ['7', '8', '9'],
    ['', '0', '⌫'],
  ];

  return (
    <View style={[styles.root, { paddingTop: insets.top + 20, paddingBottom: insets.bottom + 20 }]}>
      <TouchableOpacity onPress={onCancel} style={styles.cancelBtn}>
        <Text style={{ color: '#606080' }}>ОТМЕНА</Text>
      </TouchableOpacity>

      <Text style={styles.lock}>🔐</Text>
      <Text style={[styles.title, { color: accent }]}>{titles[step]}</Text>
      <Text style={styles.subtitle}>
        {step === 'create'
          ? 'Только ты будешь знать этот код'
          : step === 'confirm'
          ? 'Введи тот же PIN повторно'
          : 'Секретные чаты'}
      </Text>

      <View style={styles.dots}>{dots}</View>

      <View style={styles.keypad}>
        {keys.map((row, ri) => (
          <View key={ri} style={styles.keyRow}>
            {row.map((k, ki) =>
              k === '' ? (
                <View key={ki} style={styles.keyPlaceholder} />
              ) : (
                <TouchableOpacity
                  key={ki}
                  onPress={() => pressKey(k)}
                  style={styles.keyBtn}
                >
                  <Text style={[styles.keyText, k === '⌫' && { fontSize: 20 }]}>
                    {k}
                  </Text>
                </TouchableOpacity>
              ),
            )}
          </View>
        ))}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  root: {
    flex: 1,
    backgroundColor: '#0a0a0f',
    alignItems: 'center',
  },
  cancelBtn: {
    alignSelf: 'flex-start',
    paddingHorizontal: 20,
    paddingVertical: 12,
  },
  lock: {
    fontSize: 48,
    marginTop: 20,
    marginBottom: 8,
  },
  title: {
    fontSize: 22,
    fontWeight: '700',
    marginBottom: 6,
  },
  subtitle: {
    color: '#606080',
    fontSize: 13,
    textAlign: 'center',
    paddingHorizontal: 40,
    marginBottom: 32,
  },
  dots: {
    flexDirection: 'row',
    gap: 16,
    marginBottom: 40,
  },
  dot: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 1.5,
  },
  keypad: {
    width: '80%',
    maxWidth: 300,
  },
  keyRow: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: 12,
  },
  keyBtn: {
    width: 70,
    height: 70,
    borderRadius: 35,
    backgroundColor: '#12121a',
    borderWidth: 1,
    borderColor: '#1e1e2e',
    alignItems: 'center',
    justifyContent: 'center',
  },
  keyPlaceholder: {
    width: 70,
    height: 70,
  },
  keyText: {
    color: '#e0e0ff',
    fontSize: 28,
    fontWeight: '600',
  },
});
