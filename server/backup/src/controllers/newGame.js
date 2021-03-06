const shortid = require('shortid');

const NewGame = (firestore) => async (req, res) => {
    const gameSize = req.body.gameSize || 3;
    const newLobby = await firestore
        .collection('lobbies')
        .doc(shortid.generate());

    const writeResult = await newLobby.set({
        gameSize,
        fieldTypes: Array(gameSize * gameSize).fill(null),
        xIsNext: 0,
        players: [
            {
                id: shortid.generate(),
                connected: false,
            },
            {
                id: shortid.generate(),
                connected: false,
            },
        ],
        createdAt: new Date(),
    });

    return res.send({ lobbyId: newLobby.id });
};

module.exports = NewGame;
