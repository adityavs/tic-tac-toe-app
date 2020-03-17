import React, { useEffect, useMemo, useReducer } from 'react';
import GameCanvas from '../../GameCanvas';
import { firestore } from '../../../lib/firebaseUtils';
import { GAME_STATE_CHANGE, GAME_LOADED } from './types';
import { withSpinner } from '../../Spinner';
import { gameStateChange, gameLoaded } from './actions';
import { View, Text } from 'react-native';

const GameCanvasWithSpinner = withSpinner(GameCanvas);

// Advanced State manipulation
const reducer = (state, action) => {
  switch (action.type) {
    case GAME_LOADED:
      return {
        ...state,
        ...action.payload,
        gameLoaded: true,
      };
    case GAME_STATE_CHANGE:
      return {
        ...state,
        ...action.payload,
      };
    default:
      return state;
  }
};

const initialState = {
  lobbyId: undefined,
  canvas: undefined,
  players: undefined,
  gameLoaded: false,
};

const GameLoader = ({ styles, playerId, lobbyId }) => {
  const [state, dispatch] = useReducer(reducer, initialState);

  const disconnectPlayer = async () => {
    try {
      const docRef = firestore.collection('lobbies').doc(lobbyId);
      const getGameState = await docRef.get();
      const gamePlayers = getGameState.data().players;

      const players = gamePlayers.map((player, idx) =>
        idx === playerId ? { ...player, connected: false } : player
      );

      await docRef.set({ players }, { merge: true });

      console.log(`player ${playerId} connected`);
    } catch (err) {
      console.log(err.message);
    }
  };

  const connectPlayer = async () => {
    try {
      const docRef = firestore.collection('lobbies').doc(lobbyId);

      const players = state.players.map((player, idx) =>
        idx === playerId ? { ...player, connected: true } : player
      );

      await docRef.set({ players }, { merge: true });
    } catch (err) {
      console.log(err.message);
    }
  };

  useEffect(() => {
    state.gameLoaded && connectPlayer();
  }, [state.gameLoaded]);

  useEffect(() => {
    const docRef = firestore.collection('lobbies').doc(lobbyId);

    let initial = true;
    const channel = docRef.onSnapshot(
      snapshot => {
        // This code will change.
        if (initial) {
          dispatch(gameLoaded({ lobbyId, ...snapshot.data() }));
          initial = false;
        } else {
          dispatch(gameStateChange({ lobbyId, ...snapshot.data() }));
        }
      },
      err => console.error(err)
    );

    return () => {
      disconnectPlayer();
      channel();
    };
  }, [lobbyId]);

  const connectedPlayers = useMemo(() => {
    const result = state.players ? state.players.filter(player => player.connected) : 0;

    return result;
  }, [state.players]);

  return (
    <View>
      <Text style={styles.text}>LobbyID: {lobbyId}</Text>
      <Text style={styles.text}>You are player: {playerId + 1}</Text>

      <GameCanvasWithSpinner
        msg={`Waiting for players, [${connectedPlayers.length}] connected`}
        loading={connectedPlayers.length < 2}
      />
    </View>
  );
};

export default GameLoader;
