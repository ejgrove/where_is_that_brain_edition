import { StatusBar } from 'expo-status-bar';
import { startTransition, useMemo, useState } from 'react';
import {
  Pressable,
  SafeAreaView,
  ScrollView,
  StyleSheet,
  Switch,
  Text,
  TextInput,
  View,
} from 'react-native';
import { OrthogonalSliceMap } from './src/components/OrthogonalSliceMap';
import { defaultLayerId, getLayerById, layers } from './src/data/layers';
import type {
  GameConfig,
  GameSession,
  PendingGuess,
  PlayerAnswer,
  TurnFeedback,
} from './src/types/game';
import { buildTurnDeck, createScores, normalizePlayers } from './src/utils/game';

type Screen = 'setup' | 'handoff' | 'play' | 'results';

const ROUND_OPTIONS = [3, 5, 8];

const defaultConfig: GameConfig = {
  layerId: defaultLayerId,
  roundsPerPlayer: 5,
  players: ['Player 1'],
  settings: {
    highlightSelection: true,
    showBorders: true,
  },
};

export default function App() {
  const [screen, setScreen] = useState<Screen>('setup');
  const [config, setConfig] = useState<GameConfig>(defaultConfig);
  const [session, setSession] = useState<GameSession | null>(null);
  const [feedback, setFeedback] = useState<TurnFeedback | null>(null);
  const [pendingGuess, setPendingGuess] = useState<PendingGuess | null>(null);
  const [roundAnswers, setRoundAnswers] = useState<PlayerAnswer[]>([]);

  const activeLayer = useMemo(
    () => getLayerById(session?.layerId ?? config.layerId),
    [config.layerId, session?.layerId]
  );

  const currentTurn = session ? session.deck[session.turnIndex] : null;
  const promptRegion =
    currentTurn && activeLayer
      ? activeLayer.regions.find((region) => region.id === currentTurn.promptRegionId) ?? null
      : null;
  const currentPlayerName =
    currentTurn && session ? session.players[currentTurn.playerIndex] ?? 'Player' : 'Player';

  const updateConfig = (patch: Partial<GameConfig>) => {
    setConfig((current) => ({ ...current, ...patch }));
  };

  const updateSettings = (patch: Partial<GameConfig['settings']>) => {
    setConfig((current) => ({
      ...current,
      settings: { ...current.settings, ...patch },
    }));
  };

  const handlePlayerChange = (index: number, name: string) => {
    const players = [...config.players];
    players[index] = name;
    updateConfig({ players });
  };

  const handleAddPlayer = () => {
    if (config.players.length >= 6) {
      return;
    }
    updateConfig({ players: [...config.players, `Player ${config.players.length + 1}`] });
  };

  const handleRemovePlayer = (index: number) => {
    if (config.players.length === 1) {
      return;
    }
    updateConfig({
      players: config.players.filter((_, playerIndex) => playerIndex !== index),
    });
  };

  const handleStart = () => {
    const players = normalizePlayers(config.players);
    const layer = getLayerById(config.layerId);
    const deck = buildTurnDeck(layer, players.length, config.roundsPerPlayer);

    startTransition(() => {
      setSession({
        layerId: layer.id,
        roundsPerPlayer: config.roundsPerPlayer,
        players,
        deck,
        scores: createScores(players.length),
        turnIndex: 0,
      });
      setFeedback(null);
      setPendingGuess(null);
      setRoundAnswers([]);
      setScreen(players.length > 1 ? 'handoff' : 'play');
    });
  };

  const handlePreviewGuess = (guess: PendingGuess) => {
    if (!session || !currentTurn || !promptRegion || feedback) {
      return;
    }

    if (guess.selectedRegionId) {
      const selectedRegion = activeLayer.regions.find((region) => region.id === guess.selectedRegionId);
      if (!selectedRegion) {
        return;
      }
    }

    setPendingGuess(guess);
  };

  const handleConfirmAnswer = () => {
    if (!session || !currentTurn || !promptRegion || feedback || !pendingGuess) {
      return;
    }

    const answer: PlayerAnswer = {
      ...pendingGuess,
      playerIndex: currentTurn.playerIndex,
      correct: pendingGuess.selectedRegionId === currentTurn.promptRegionId,
    };
    const completedAnswers = [...roundAnswers, answer];
    const nextTurn = session.deck[session.turnIndex + 1];
    const roundComplete = !nextTurn || nextTurn.promptRegionId !== currentTurn.promptRegionId;

    if (roundComplete) {
      setSession((current) => {
        if (!current) {
          return current;
        }

        const nextScores = [...current.scores];
        completedAnswers.forEach((completedAnswer) => {
          if (completedAnswer.correct) {
            nextScores[completedAnswer.playerIndex] += 100;
          }
        });

        return {
          ...current,
          scores: nextScores,
        };
      });
      setRoundAnswers(completedAnswers);
      setFeedback({
        correct: answer.correct,
        selectedRegionId: answer.selectedRegionId,
        promptRegionId: currentTurn.promptRegionId,
        pin: answer.pin,
        coordinate: answer.coordinate,
      });
      return;
    }

    startTransition(() => {
      setRoundAnswers(completedAnswers);
      setSession((current) =>
        current ? { ...current, turnIndex: current.turnIndex + 1 } : current
      );
      setPendingGuess(null);
      setScreen('handoff');
    });
  };

  const handleAdvanceTurn = () => {
    if (!session) {
      return;
    }

    const isLastTurn = session.turnIndex >= session.deck.length - 1;
    if (isLastTurn) {
      setFeedback(null);
      setPendingGuess(null);
      setRoundAnswers([]);
      setScreen('results');
      return;
    }

    startTransition(() => {
      setSession((current) =>
        current
          ? {
              ...current,
              turnIndex: current.turnIndex + 1,
            }
          : current
      );
      setFeedback(null);
      setPendingGuess(null);
      setRoundAnswers([]);
      setScreen(session.players.length > 1 ? 'handoff' : 'play');
    });
  };

  const handleRestart = () => {
    setFeedback(null);
    setPendingGuess(null);
    setRoundAnswers([]);
    setSession(null);
    setScreen('setup');
  };

  const handleExitToHome = () => {
    setFeedback(null);
    setPendingGuess(null);
    setRoundAnswers([]);
    setSession(null);
    setScreen('setup');
  };

  const handleClearPendingGuess = () => {
    setPendingGuess(null);
  };

  const rankedScores = session
    ? session.players
        .map((player, index) => ({ player, score: session.scores[index] ?? 0 }))
        .sort((left, right) => right.score - left.score)
    : [];
  const pendingRegionLabel = pendingGuess
    ? activeLayer.regions.find((region) => region.id === pendingGuess.selectedRegionId)?.label ?? null
    : null;
  const groupedRoundAnswers = groupAnswersByRegion(roundAnswers, session?.players ?? [], activeLayer);
  const roundNumber = session ? Math.floor(session.turnIndex / session.players.length) + 1 : 1;

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="light" />
      <View style={styles.backgroundGlowOne} />
      <View style={styles.backgroundGlowTwo} />
      <View style={styles.appShell}>
        {screen === 'setup' ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.eyebrow}>Mobile Prototype</Text>
            <Text style={styles.title}>Where Is This Brain?</Text>
            <Text style={styles.subtitle}>
              A touch-first neuroanatomy game built around linked sagittal, coronal, and axial
              slices that already work well on phone and web.
            </Text>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Atlas</Text>
              <Text style={styles.sectionBody}>
                This build is focused on one higher-detail structural slice atlas so we can grow
                the anatomy without splitting attention across multiple game surfaces.
              </Text>
              <View style={styles.layerCard}>
                <View style={styles.layerCardHeader}>
                  <Text style={styles.layerTitle}>{layers[0].name}</Text>
                  <Text style={styles.layerBadge}>{layers[0].difficulty}</Text>
                </View>
                <Text style={styles.layerBody}>{layers[0].description}</Text>
                <Text style={styles.promptDetail}>
                  Views: sagittal, coronal, and axial. Atlas source: {layers[0].atlasSource}.
                </Text>
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Players</Text>
              <Text style={styles.sectionBody}>
                Use one player for solo practice or add names for pass-and-play on one phone.
              </Text>
              <View style={styles.stack}>
                {config.players.map((player, index) => (
                  <View key={`player-${index}`} style={styles.playerRow}>
                    <TextInput
                      value={player}
                      onChangeText={(value) => handlePlayerChange(index, value)}
                      placeholder={`Player ${index + 1}`}
                      placeholderTextColor="#7a8f98"
                      style={styles.playerInput}
                    />
                    <Pressable
                      onPress={() => handleRemovePlayer(index)}
                      style={[
                        styles.smallButton,
                        config.players.length === 1 && styles.smallButtonDisabled,
                      ]}
                    >
                      <Text style={styles.smallButtonText}>Remove</Text>
                    </Pressable>
                  </View>
                ))}
              </View>
              <Pressable onPress={handleAddPlayer} style={styles.secondaryButton}>
                <Text style={styles.secondaryButtonText}>Add Player</Text>
              </Pressable>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Rounds Per Player</Text>
              <View style={styles.choiceRow}>
                {ROUND_OPTIONS.map((rounds) => {
                  const selected = config.roundsPerPlayer === rounds;
                  return (
                    <Pressable
                      key={rounds}
                      onPress={() => updateConfig({ roundsPerPlayer: rounds })}
                      style={[styles.choiceChip, selected && styles.choiceChipSelected]}
                    >
                      <Text style={[styles.choiceChipText, selected && styles.choiceChipTextSelected]}>
                        {rounds}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Settings</Text>
              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Highlight selected region</Text>
                  <Text style={styles.toggleBody}>
                    Default mode. On slice atlases this fills the structure under your crosshair.
                    If off, the crosshair still marks the coordinate but the region stays unfilled
                    until reveal.
                  </Text>
                </View>
                <Switch
                  value={config.settings.highlightSelection}
                  onValueChange={(value) => updateSettings({ highlightSelection: value })}
                  trackColor={{ false: '#6f7f86', true: '#e4863a' }}
                  thumbColor="#f7f3ea"
                />
              </View>
              <View style={styles.toggleRow}>
                <View style={styles.toggleCopy}>
                  <Text style={styles.toggleTitle}>Show region borders</Text>
                  <Text style={styles.toggleBody}>
                    Hide borders for a harder mode while keeping the same gameplay scoring.
                  </Text>
                </View>
                <Switch
                  value={config.settings.showBorders}
                  onValueChange={(value) => updateSettings({ showBorders: value })}
                  trackColor={{ false: '#6f7f86', true: '#2f8a82' }}
                  thumbColor="#f7f3ea"
                />
              </View>
            </View>

            <Pressable onPress={handleStart} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Start Game</Text>
            </Pressable>
          </ScrollView>
        ) : null}

        {screen === 'handoff' && currentTurn ? (
          <View style={styles.centerScreen}>
            <Text style={styles.eyebrow}>Pass The Phone</Text>
            <Text style={styles.handoffTitle}>{currentPlayerName}</Text>
            <Text style={styles.handoffBody}>
              Round {roundNumber} of {session?.roundsPerPlayer ?? 0} • Player{' '}
              {(currentTurn.playerIndex ?? 0) + 1} of {session?.players.length ?? 0}
            </Text>
            <Text style={styles.handoffHint}>
              When they are ready, tap below to show the prompt and brain map.
            </Text>
            <Pressable onPress={() => setScreen('play')} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Ready</Text>
            </Pressable>
            <Pressable onPress={handleExitToHome} style={styles.secondaryExitButton}>
              <Text style={styles.secondaryExitButtonText}>Back To Home</Text>
            </Pressable>
          </View>
        ) : null}

        {screen === 'play' && session && currentTurn && promptRegion ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <View style={styles.topActionRow}>
              <Pressable onPress={handleExitToHome} style={styles.secondaryExitButton}>
                <Text style={styles.secondaryExitButtonText}>Back To Home</Text>
              </Pressable>
            </View>
            <View style={styles.scoreCard}>
              <View>
                <Text style={styles.scoreEyebrow}>
                  {currentPlayerName} • Round {roundNumber}/{session.roundsPerPlayer} • Player{' '}
                  {currentTurn.playerIndex + 1}/{session.players.length}
                </Text>
                <Text style={styles.promptTitle}>Find {promptRegion.label}</Text>
                <Text style={styles.promptSubtitle}>{activeLayer.description}</Text>
                {promptRegion.teachingSummary ? (
                  <Text style={styles.promptDetail}>{promptRegion.teachingSummary}</Text>
                ) : null}
              </View>
            </View>

            <View style={styles.scoreRow}>
              {session.players.map((player, index) => {
                const active = index === currentTurn.playerIndex;
                return (
                  <View
                    key={`${player}-${index}`}
                    style={[styles.scorePill, active && styles.scorePillActive]}
                  >
                    <Text style={[styles.scorePlayer, active && styles.scorePlayerActive]}>{player}</Text>
                    <Text style={[styles.scoreValue, active && styles.scorePlayerActive]}>
                      {session.scores[index]}
                    </Text>
                  </View>
                );
              })}
            </View>

            <View style={styles.card}>
              <OrthogonalSliceMap
                layer={activeLayer}
                settings={config.settings}
                previewGuess={pendingGuess}
                feedbackRegionId={feedback?.promptRegionId ?? null}
                revealedAnswers={feedback ? groupedRoundAnswers : []}
                turnKey={session.turnIndex}
                interactionEnabled
                onPreviewGuess={handlePreviewGuess}
              />
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Round Feedback</Text>
              {feedback ? (
                <>
                  <Text style={[styles.feedbackTitle, styles.correct]}>Round complete.</Text>
                  <Text style={styles.sectionBody}>
                    Correct answer: {promptRegion.label}. All player choices are shown below and on
                    the slice views.
                  </Text>
                  <View style={styles.answerRevealList}>
                    {groupedRoundAnswers.map((answerGroup) => (
                      <View key={answerGroup.key} style={styles.answerRevealRow}>
                        <Text style={styles.answerRevealNames}>{answerGroup.names.join(' + ')}</Text>
                        <Text style={styles.answerRevealChoice}>
                          {answerGroup.regionLabel ?? 'Outside the labeled regions'}
                        </Text>
                      </View>
                    ))}
                  </View>
                  {promptRegion.keyFunctions?.length ? (
                    <Text style={styles.teachingNote}>
                      Key functions: {promptRegion.keyFunctions.join(' • ')}.
                    </Text>
                  ) : null}
                  {promptRegion.structuralNote ? (
                    <Text style={styles.teachingNote}>{promptRegion.structuralNote}</Text>
                  ) : null}
                  <Pressable onPress={handleAdvanceTurn} style={styles.primaryButton}>
                    <Text style={styles.primaryButtonText}>
                      {session.turnIndex === session.deck.length - 1 ? 'See Results' : 'Next Turn'}
                    </Text>
                  </Pressable>
                </>
              ) : (
                <>
                  <Text style={styles.sectionBody}>
                    Move the linked sagittal, coronal, and axial crosshair until it lands in the
                    target structure, then confirm your coordinate.
                  </Text>
                  <Text style={styles.selectionMeta}>
                    {pendingGuess?.coordinate
                      ? pendingGuess.selectedRegionId
                        ? `Coordinate ${formatCoordinate(pendingGuess.coordinate)} is inside ${pendingRegionLabel ?? 'a labeled region'}.`
                        : `Coordinate ${formatCoordinate(pendingGuess.coordinate)} is outside the labeled teaching regions in this atlas.`
                      : 'No coordinate selected yet.'}
                  </Text>
                  <View style={styles.confirmRow}>
                    <Pressable
                      onPress={handleClearPendingGuess}
                      style={[
                        styles.secondaryActionButton,
                        !pendingGuess && styles.secondaryActionButtonDisabled,
                      ]}
                      disabled={!pendingGuess}
                    >
                      <Text style={styles.secondaryActionButtonText}>Clear</Text>
                    </Pressable>
                    <Pressable
                      onPress={handleConfirmAnswer}
                      style={[
                        styles.primaryButton,
                        styles.confirmButton,
                        !pendingGuess && styles.primaryButtonDisabled,
                      ]}
                      disabled={!pendingGuess}
                    >
                      <Text style={styles.primaryButtonText}>Confirm Answer</Text>
                    </Pressable>
                  </View>
                </>
              )}
            </View>
          </ScrollView>
        ) : null}

        {screen === 'results' && session ? (
          <ScrollView contentContainerStyle={styles.scrollContent}>
            <Text style={styles.eyebrow}>Game Complete</Text>
            <Text style={styles.title}>Results</Text>
            <Text style={styles.subtitle}>
              Scoring is simple right now: 100 points for landing in the correct labeled region.
            </Text>

            <View style={styles.card}>
              {rankedScores.map((entry, index) => (
                <View key={`${entry.player}-${index}`} style={styles.resultRow}>
                  <Text style={styles.resultRank}>{index + 1}</Text>
                  <View style={styles.resultCopy}>
                    <Text style={styles.resultName}>{entry.player}</Text>
                    <Text style={styles.resultMeta}>{entry.score} points</Text>
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.card}>
              <Text style={styles.sectionTitle}>What Is Ready Next</Text>
              <Text style={styles.sectionBody}>
                The pass-and-play loop and the slice atlas are now the main product. Next we can
                keep enriching this same atlas with more structures, stronger region definitions,
                function-based prompts, and later distance-based scoring.
              </Text>
            </View>

            <Pressable onPress={handleRestart} style={styles.primaryButton}>
              <Text style={styles.primaryButtonText}>Back To Setup</Text>
            </Pressable>
          </ScrollView>
        ) : null}
      </View>
    </SafeAreaView>
  );
}

function formatCoordinate(coordinate: NonNullable<PendingGuess['coordinate']>) {
  return `x ${coordinate.x}, y ${coordinate.y}, z ${coordinate.z}`;
}

function groupAnswersByRegion(
  answers: PlayerAnswer[],
  players: string[],
  layer: ReturnType<typeof getLayerById>
) {
  const groups = new Map<
    string,
    {
      key: string;
      regionId: string | null;
      regionLabel: string | null;
      names: string[];
      coordinate: PendingGuess['coordinate'];
    }
  >();

  answers.forEach((answer, index) => {
    const key = answer.selectedRegionId ?? `outside-${index}`;
    const existing = groups.get(key);
    const name = players[answer.playerIndex] ?? `Player ${answer.playerIndex + 1}`;
    if (existing) {
      existing.names.push(name);
      return;
    }

    groups.set(key, {
      key,
      regionId: answer.selectedRegionId,
      regionLabel:
        layer.regions.find((region) => region.id === answer.selectedRegionId)?.label ?? null,
      names: [name],
      coordinate: answer.coordinate,
    });
  });

  return Array.from(groups.values());
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#0f2029',
  },
  appShell: {
    flex: 1,
  },
  scrollContent: {
    padding: 20,
    gap: 18,
  },
  topActionRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  backgroundGlowOne: {
    position: 'absolute',
    top: -80,
    right: -20,
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: '#1f5660',
    opacity: 0.35,
  },
  backgroundGlowTwo: {
    position: 'absolute',
    bottom: 80,
    left: -40,
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: '#c96d2d',
    opacity: 0.18,
  },
  eyebrow: {
    color: '#8ab8b9',
    fontSize: 13,
    fontWeight: '700',
    letterSpacing: 1.5,
    textTransform: 'uppercase',
  },
  title: {
    color: '#f7f3ea',
    fontSize: 34,
    lineHeight: 38,
    fontWeight: '800',
  },
  subtitle: {
    color: '#c7d4d8',
    fontSize: 16,
    lineHeight: 24,
  },
  card: {
    backgroundColor: 'rgba(16, 37, 46, 0.86)',
    borderColor: 'rgba(244, 219, 190, 0.12)',
    borderWidth: 1,
    borderRadius: 24,
    padding: 18,
    gap: 14,
  },
  stack: {
    gap: 12,
  },
  sectionTitle: {
    color: '#f7f3ea',
    fontSize: 20,
    fontWeight: '700',
  },
  sectionBody: {
    color: '#c7d4d8',
    fontSize: 15,
    lineHeight: 22,
  },
  teachingNote: {
    color: '#dcecf0',
    fontSize: 14,
    lineHeight: 20,
    marginTop: 10,
  },
  selectionMeta: {
    color: '#f0d7b0',
    fontSize: 14,
    lineHeight: 21,
  },
  layerCard: {
    backgroundColor: '#18323d',
    borderRadius: 18,
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 14,
    gap: 10,
  },
  layerCardSelected: {
    backgroundColor: '#f0d7b0',
    borderColor: '#ffeed5',
  },
  layerCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 10,
  },
  layerTitle: {
    color: '#f7f3ea',
    fontSize: 17,
    fontWeight: '700',
    flex: 1,
  },
  layerTitleSelected: {
    color: '#1b2e36',
  },
  layerBody: {
    color: '#b7c7ca',
    fontSize: 14,
    lineHeight: 20,
  },
  layerBodySelected: {
    color: '#29454d',
  },
  layerBadge: {
    color: '#e6b781',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  layerBadgeSelected: {
    color: '#9a541e',
  },
  playerRow: {
    flexDirection: 'row',
    gap: 10,
    alignItems: 'center',
  },
  playerInput: {
    flex: 1,
    borderRadius: 16,
    backgroundColor: '#102f38',
    borderColor: '#284854',
    borderWidth: 1,
    paddingHorizontal: 14,
    paddingVertical: 12,
    color: '#f7f3ea',
    fontSize: 15,
  },
  smallButton: {
    backgroundColor: '#315764',
    borderRadius: 14,
    paddingHorizontal: 14,
    paddingVertical: 12,
  },
  smallButtonDisabled: {
    opacity: 0.45,
  },
  smallButtonText: {
    color: '#f7f3ea',
    fontWeight: '700',
  },
  secondaryButton: {
    alignSelf: 'flex-start',
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#43707d',
    paddingHorizontal: 14,
    paddingVertical: 11,
  },
  secondaryButtonText: {
    color: '#dce7e8',
    fontWeight: '700',
  },
  explorerPreviewCard: {
    borderRadius: 18,
    backgroundColor: '#16343f',
    padding: 14,
    gap: 8,
  },
  explorerPresetName: {
    color: '#f7f3ea',
    fontSize: 17,
    fontWeight: '700',
  },
  explorerPresetBody: {
    color: '#c0d2d7',
    fontSize: 14,
    lineHeight: 21,
  },
  searchChipRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  searchChip: {
    borderRadius: 999,
    backgroundColor: '#213f49',
    paddingHorizontal: 12,
    paddingVertical: 9,
  },
  searchChipText: {
    color: '#e6eff1',
    fontSize: 13,
    fontWeight: '700',
  },
  choiceRow: {
    flexDirection: 'row',
    gap: 10,
  },
  choiceChip: {
    minWidth: 58,
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#163843',
  },
  choiceChipSelected: {
    backgroundColor: '#2f8a82',
  },
  choiceChipText: {
    color: '#d6e6e7',
    fontWeight: '700',
  },
  choiceChipTextSelected: {
    color: '#f7f3ea',
  },
  toggleRow: {
    flexDirection: 'row',
    gap: 16,
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  toggleCopy: {
    flex: 1,
    gap: 6,
  },
  toggleTitle: {
    color: '#f7f3ea',
    fontSize: 16,
    fontWeight: '700',
  },
  toggleBody: {
    color: '#b9c7ca',
    fontSize: 14,
    lineHeight: 20,
  },
  primaryButton: {
    backgroundColor: '#dd7f36',
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 15,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primaryButtonText: {
    color: '#13252d',
    fontSize: 16,
    fontWeight: '800',
  },
  primaryButtonDisabled: {
    opacity: 0.45,
  },
  confirmRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
  },
  confirmButton: {
    minWidth: 164,
  },
  secondaryActionButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#476773',
    paddingHorizontal: 16,
    paddingVertical: 14,
  },
  secondaryActionButtonDisabled: {
    opacity: 0.45,
  },
  secondaryActionButtonText: {
    color: '#dce7e8',
    fontWeight: '700',
  },
  secondaryExitButton: {
    borderRadius: 16,
    borderWidth: 1,
    borderColor: '#4b6f79',
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  secondaryExitButtonText: {
    color: '#dce7e8',
    fontWeight: '700',
  },
  presetChoiceCard: {
    borderRadius: 18,
    backgroundColor: '#18323d',
    borderWidth: 1,
    borderColor: 'transparent',
    padding: 14,
    gap: 8,
  },
  presetChoiceCardSelected: {
    backgroundColor: '#f0d7b0',
    borderColor: '#ffeed5',
  },
  presetChoiceTitle: {
    color: '#f7f3ea',
    fontSize: 16,
    fontWeight: '700',
  },
  presetChoiceTitleSelected: {
    color: '#1b2e36',
  },
  presetChoiceBody: {
    color: '#c0d2d7',
    fontSize: 14,
    lineHeight: 21,
  },
  presetChoiceBodySelected: {
    color: '#29454d',
  },
  centerScreen: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: 28,
    gap: 14,
  },
  handoffTitle: {
    color: '#f7f3ea',
    fontSize: 36,
    lineHeight: 40,
    fontWeight: '800',
    textAlign: 'center',
  },
  handoffBody: {
    color: '#f2cf9f',
    fontSize: 16,
    fontWeight: '700',
  },
  handoffHint: {
    color: '#c7d4d8',
    textAlign: 'center',
    fontSize: 15,
    lineHeight: 22,
    marginBottom: 4,
  },
  scoreCard: {
    backgroundColor: 'rgba(240, 215, 176, 0.95)',
    borderRadius: 24,
    padding: 18,
  },
  scoreEyebrow: {
    color: '#6d4c2d',
    fontWeight: '700',
    marginBottom: 6,
  },
  promptTitle: {
    color: '#13252d',
    fontSize: 28,
    lineHeight: 32,
    fontWeight: '800',
  },
  promptSubtitle: {
    color: '#39525d',
    marginTop: 8,
    fontSize: 15,
    lineHeight: 22,
  },
  promptDetail: {
    color: '#21414d',
    marginTop: 10,
    fontSize: 14,
    lineHeight: 20,
  },
  scoreRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
    paddingHorizontal: 2,
  },
  scorePill: {
    borderRadius: 999,
    backgroundColor: 'rgba(20, 47, 57, 0.85)',
    paddingHorizontal: 14,
    paddingVertical: 10,
    minWidth: 112,
  },
  scorePillActive: {
    backgroundColor: '#2f8a82',
  },
  scorePlayer: {
    color: '#c9d6d8',
    fontSize: 12,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.8,
  },
  scorePlayerActive: {
    color: '#f7f3ea',
  },
  scoreValue: {
    color: '#f7f3ea',
    fontSize: 20,
    fontWeight: '800',
  },
  feedbackTitle: {
    fontSize: 22,
    fontWeight: '800',
  },
  answerRevealList: {
    gap: 8,
  },
  answerRevealRow: {
    backgroundColor: '#18323d',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 3,
  },
  answerRevealNames: {
    color: '#f2cf9f',
    fontSize: 13,
    fontWeight: '800',
  },
  answerRevealChoice: {
    color: '#f7f3ea',
    fontSize: 16,
    fontWeight: '700',
  },
  correct: {
    color: '#8dd6a4',
  },
  incorrect: {
    color: '#efb289',
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 14,
    paddingVertical: 6,
  },
  resultRank: {
    color: '#f0d7b0',
    fontSize: 22,
    fontWeight: '800',
    width: 28,
  },
  resultCopy: {
    gap: 3,
  },
  resultName: {
    color: '#f7f3ea',
    fontSize: 18,
    fontWeight: '700',
  },
  resultMeta: {
    color: '#c3d0d4',
    fontSize: 14,
  },
});
