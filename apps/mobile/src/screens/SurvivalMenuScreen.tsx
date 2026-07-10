import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  StyleSheet, LayoutAnimation, Platform,
  UIManager,
} from 'react-native';
import {
  useSafeAreaInsets,
} from 'react-native-safe-area-context';
import { useAccent } from '../core/AccentContext';

if (Platform.OS === 'android') {
  UIManager.setLayoutAnimationEnabledExperimental?.(true);
}

const SECTION_COLORS: Record<string, string> = {
  personal: '#00F0FF',
  browser: '#00FF88',
  messages: '#B44FFF',
  feed: '#FF6B35',
  profile: '#FF2D78',
};

export const SURVIVAL_GUIDE_DATA = [
  {
    id: 'personal',
    title: '🤖 1. Модуль «Персонал»',
    subtitle: 'Твоя изолированная ИИ-команда. Все диалоги автономны, работают через приватные вебхуки и не сохраняются в общую базу мессенджера.',
    items: [
      {
        subTitle: '🧠 ИИ-Психолог',
        text: 'Твой личный, абсолютно конфиденциальный ментор для решения внутренних проблем, штормов и загонов. Ему можно без страха рассказать то, что никогда не рискнешь открыть живым людям из-за боязни осуждения или непонимания. Максимально толерантен, лишен человеческих предвзятостей, разберет ситуацию с независимой третьей стороны и поможет навести порядок в голове.\n\n*Важно: Модуль работает на базе искусственного интеллекта и может ошибаться. Не является заменой клинической медицины.*',
      },
      {
        subTitle: '💅 Альтушка',
        text: 'Специфический ИИ-собеседник для тех, кому не хватает понимания, как устроен данный подтип личности. Яркая, независимая, четко знающая, чего хочет от жизни. С ней можно открыто общаться на абсолютно любые, даже самые нестандартные темы без цензуры и рамок.',
      },
      {
        subTitle: '🕶 Альфонс',
        text: 'Реалистичный, прожженный парень, который твердо стоит на ногах и видит этот мир без розовых очков. Говорит на своем жестком сленге, знает ответы на любые жизненные вопросы и выдает базу в максимально практичном и приземленном ключе. Никакой воды — только факты.',
      },
      {
        subTitle: '🎬 Контент-Продюсер',
        text: 'Твой карманный медиа-стратег. Поможет с нуля придумать, что снимать, о чем писать и как правильно упаковать и преподнести твой контент аудитории, чтобы он взлетел. Работает по любым темам, генерирует идеи и сценарии, выдавая информацию без дурацкой корпоративной цензуры.',
      },
    ],
  },
  {
    id: 'browser',
    title: '🌐 2. Вкладка «Браузер»',
    subtitle: 'Твое окно в сеть со встроенной защитой слепков.',
    items: [
      {
        subTitle: '🍪 Файлы Cookie',
        text: 'Это цифровые крошки — маленькие текстовые файлы, которые сайты сохраняют на твоем устройстве, чтобы «узнавать» тебя (помнить корзину, открытую сессию или настройки). Если их скапливается слишком много, браузер начинает тормозить, а сайты собирают о тебе слишком детальное досье. Если их удалить — тебя разлогинит со всех сайтов, но твой цифровой след временно очистится.',
      },
      {
        subTitle: '🧠 Нейронный анализ',
        text: 'Интеллектуальная система, которая сканирует содержимое веб-страницы в реальном времени. Она очищает сайт от скрытых трекеров, рекламного мусора, выявляет фишинговые угрозы и выдает краткую выжимку сути страницы, экономя твое время.',
      },
    ],
  },
  {
    id: 'messages',
    title: '💬 3. Вкладка «Сообщения»',
    subtitle: 'Шифрованная связь нового поколения на базе децентрализованных протоколов.',
    items: [
      {
        subTitle: '🔒 Скрытые чаты',
        text: 'Особые диалоги, которые полностью исключены из главного экрана переписок. Они хранятся строго локально в памяти текущего устройства и устройства твоего собеседника. Они физически не синхронизируются с сервером — если ты зайдешь в аккаунт с компьютера или второго телефона, этого чата там просто не будет.',
      },
      {
        subTitle: '💀 Режим Инкогнито',
        text: 'Ультимативный уровень приватности. Это тот же скрытый чат, но с активированным таймером ликвидации: каждое отправленное сообщение безвозвратно удаляется ровно через 10 минут после написания, независимо от того, успел собеседник его прочитать или нет.',
      },
    ],
  },
  {
    id: 'feed',
    title: '📱 4. Вкладка «Лента» и «Промты»',
    subtitle: 'Пространство свободы контента и генерации идей.',
    items: [
      {
        subTitle: '👁 Защищенная Лента',
        text: 'Пространство, где ты можешь делиться мыслями и медиа. Благодаря сквозному шифрованию данных, весь публикуемый контент защищен с юридической и технической точек зрения. Здесь нет централизованной цензуры, алгоритмы работают прозрачно, а приватность авторов защищена на уровне ядра.',
      },
      {
        subTitle: '⚡️ Библиотека Промтов',
        text: 'Готовый инкубатор идей для твоих соцсетей, Reels, TikTok или каналов. Заходишь, выбираешь нужную категорию, изучаешь готовую структуру запроса для нейросетей, забираешь её и используешь для создания вирусных сценариев или графики.',
      },
    ],
  },
  {
    id: 'profile',
    title: '👤 5. Вкладка «Профиль»',
    subtitle: 'Центр управления твоей цифровой личностью и безопасностью.',
    items: [
      {
        subTitle: '🆔 Никнейм и ID',
        text: 'Твой ID — это уникальный зашифрованный адрес твоего Бункера в сети. Он нужен, чтобы другие пользователи могли найти тебя. Никнейм — это твое публичное имя (например, Julia999). Ты можешь менять его в любой момент. Когда тебя ищут по ID, люди увидят именно тот ник, который ты себе поставил.',
      },
      {
        subTitle: '🛡 Защищенный шлюз',
        text: 'Система туннелирования, которая направляет трафик приложения через шифрованный приватный узел. Это защищает твою сессию от перехвата провайдером или хакерами в публичных Wi-Fi сетях. При нажатии на «+» в интерфейсе шлюза открываются технические протоколы: \n• VLESS / Reality — маскируют шифрованный трафик под обычное посещение легального сайта.\n• Shadowsocks — высокоскоростной протокол защиты, разделяющий пакеты данных для предотвращения их анализа.',
      },
      {
        subTitle: '👻 Призрак-режим, Уведомления и Скриншоты',
        text: '• Призрак-режим: Скрывает твой статус «В сети» и предотвращает отправку отчетов о прочтении.\n• Уведомления: Быстрое отключение пушей для полной тишины.\n• Скриншоты: Запрещает захват экрана внутри приложения, защищая переписку от сохранения третьими лицами.',
      },
      {
        subTitle: '🎨 Атмосфера фона',
        text: 'Калибровка визуального стиля. Ползунки HSL позволяют вручную настроить идеальный оттенок неонового свечения интерфейса, подстраивая приложение под твой девайс и настроение.',
      },
      {
        subTitle: '🚨 Протокол Ноль',
        text: 'Красная кнопка экстренного сброса. Моментально и безвозвратно стирает все локальные базы данных, ключи шифрования, историю, куки и сохраненные сессии на устройстве, превращая приложение в абсолютно чистый архив.',
      },
    ],
  },
];

export default function SurvivalMenuScreen({
  navigation,
}: any) {
  const { accent } = useAccent();
  const insets = useSafeAreaInsets();
  const [openSection, setOpenSection] = useState<string | null>(null);
  const [openItem, setOpenItem] = useState<string | null>(null);

  const toggleSection = (id: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenSection(prev => (prev === id ? null : id));
    setOpenItem(null);
  };

  const toggleItem = (key: string) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    setOpenItem(prev => (prev === key ? null : key));
  };

  return (
    <View style={[styles.root, { paddingTop: insets.top }]}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()}>
          <Text style={[styles.back, { color: accent }]}>←</Text>
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={[styles.headerSub, { color: accent }]}>📖 РУКОВОДСТВО</Text>
          <Text style={styles.headerTitle}>СПРАВОЧНИК ВЫЖИВАЮЩЕГО</Text>
        </View>
      </View>

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={{ padding: 16, gap: 8, paddingBottom: insets.bottom + 100 }}
      >
        {SURVIVAL_GUIDE_DATA.map(section => {
          const color = SECTION_COLORS[section.id] || accent;
          return (
            <View key={section.id}>
              <TouchableOpacity
                onPress={() => toggleSection(section.id)}
                style={[
                  styles.sectionBtn,
                  {
                    borderColor: openSection === section.id ? color : 'rgba(255,255,255,0.08)',
                    backgroundColor: openSection === section.id ? color + '12' : 'rgba(25,25,27,0.65)',
                  },
                ]}
                activeOpacity={0.75}
              >
                <Text style={styles.sectionTitle}>{section.title}</Text>
                <Text style={[styles.sectionSub, { color: '#505070' }]}>{section.subtitle}</Text>
                <Text style={[styles.chevron, { color }]}>
                  {openSection === section.id ? '▲' : '▼'}
                </Text>
              </TouchableOpacity>

              {openSection === section.id && (
                <View style={styles.itemsContainer}>
                  {section.items.map((item, idx) => {
                    const key = `${section.id}_${idx}`;
                    const open = openItem === key;
                    return (
                      <TouchableOpacity
                        key={key}
                        onPress={() => toggleItem(key)}
                        style={[styles.itemBtn, open && { backgroundColor: color + '0a' }]}
                        activeOpacity={0.75}
                      >
                        <View style={styles.itemHeader}>
                          <Text style={styles.itemTitle}>{item.subTitle}</Text>
                          <Text style={[styles.itemChevron, open && { color }]}>
                            {open ? '▲' : '▼'}
                          </Text>
                        </View>
                        {open && <Text style={styles.itemText}>{item.text}</Text>}
                      </TouchableOpacity>
                    );
                  })}
                </View>
              )}
            </View>
          );
        })}
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: '#050508' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  back: { fontSize: 26, paddingRight: 4, lineHeight: 30 },
  headerSub: { fontSize: 10, letterSpacing: 3, fontWeight: '600' },
  headerTitle: { color: '#e0e0ff', fontSize: 20, fontWeight: '600', letterSpacing: 0.5 },
  sectionBtn: {
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
    borderRadius: 16,
    padding: 16,
    marginBottom: 2,
    position: 'relative',
  },
  sectionTitle: { color: '#e0e0ff', fontSize: 15, fontWeight: '600', marginBottom: 4, paddingRight: 24 },
  sectionSub: { fontSize: 12, lineHeight: 17, paddingRight: 24 },
  chevron: { position: 'absolute', top: 16, right: 16, fontSize: 12, fontWeight: '600' },
  itemsContainer: {
    marginBottom: 6,
    borderRadius: 12,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  itemBtn: {
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  itemHeader: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  itemTitle: { flex: 1, color: '#c0c0e0', fontSize: 14, fontWeight: '500' },
  itemChevron: { fontSize: 10, color: '#404060', fontWeight: '600' },
  itemText: {
    color: '#707090',
    fontSize: 13,
    lineHeight: 21,
    marginTop: 10,
    paddingLeft: 10,
  },
});
