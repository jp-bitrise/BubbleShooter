import React, { useState } from 'react';
import { StatusBar } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { MenuScreen } from './src/screens/MenuScreen';
import { GameScreen } from './src/screens/GameScreen';

type Screen = 'menu' | 'game';

function App() {
  const [screen, setScreen] = useState<Screen>('menu');

  return (
    <SafeAreaProvider>
      <StatusBar barStyle="light-content" backgroundColor="#0D1B2A" />
      {screen === 'menu' ? (
        <MenuScreen onPlay={() => setScreen('game')} />
      ) : (
        <GameScreen onMenu={() => setScreen('menu')} />
      )}
    </SafeAreaProvider>
  );
}

export default App;
