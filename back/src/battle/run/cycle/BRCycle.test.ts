import { BRunGlobalTurnStartSAction } from '../../../shared/action/BattleRunAction';
import { ServerAction } from '../../../shared/action/TAction';
import { WSSocket } from '../../../transport/ws/WSSocket';
import { seedBCharacter } from '../../../__seeds__/seedBCharacter';
import { seedBPlayer } from '../../../__seeds__/seedBPlayer';
import { seedWebSocket } from '../../../__seeds__/seedWSSocket';
import { TimerTester } from '../../../__testUtils__/TimerTester';
import { BCharacter } from '../entities/BCharacter';
import { BPlayer } from '../entities/BPlayer';
import { BRCycle } from './BRCycle';
import { BGlobalTurn, GlobalTurnState } from './turn/BGlobalTurn';
import WebSocket = require('ws');
import { TURN_DELAY } from '../../../shared/TurnSnapshot';
import { GLOBALTURN_DELAY } from '../../../shared/GlobalTurnSnapshot';

describe('#BRCycle', () => {

    const timerTester: TimerTester = new TimerTester();

    let onSendFn1: (action: ServerAction) => void;
    let onSendFn2: (action: ServerAction) => void;

    const sockets: WebSocket[] = [
        seedWebSocket({
            onSendFn: () => onSendFn1
        }),
        seedWebSocket({
            onSendFn: () => onSendFn2
        })
    ];

    const players: BPlayer[] = sockets.map(s => seedBPlayer({ socket: new WSSocket(s) }));

    const characters: BCharacter[] = seedBCharacter(
        { length: 3 },
        i => i < 2 ? players[0] : players[1]
    );

    let cycle: BRCycle;

    beforeEach(() => {
        timerTester.beforeTest();

        onSendFn1 = () => { };
        onSendFn2 = () => { };
    });

    afterEach(() => {
        timerTester.afterTest();
    });

    it('should run the first global turn & not send action', () => {

        onSendFn1 = jest.fn();

        const launchTime = timerTester.now;

        cycle = new BRCycle(players, characters, launchTime);

        expect(cycle.globalTurn).toMatchObject<Partial<BGlobalTurn>>({
            id: 0,
            startTime: launchTime
        });

        timerTester.advanceBy(1000);

        expect(onSendFn1).not.toHaveBeenCalled();
    });

    it('should send action on second turn, not before', () => {

        const actions: ServerAction[] = [];

        const on = jest.fn((action: ServerAction) => {
            actions.push(action);
        });

        // test for the TWO players
        onSendFn1 = onSendFn2 = on;

        const launchTime = timerTester.now;

        cycle = new BRCycle(players, characters, launchTime);

        expect(on).not.toHaveBeenCalled();

        const { turnDuration } = cycle.globalTurn.currentTurn;

        timerTester.advanceBy(turnDuration + 10);

        expect(on).toHaveBeenCalledTimes(players.length);

        expect(actions
            .filter(a => a.type === 'battle-run/turn-start')
        ).toHaveLength(players.length);

        expect(actions
            .map(a => a.type)
        ).not.toContain<BRunGlobalTurnStartSAction['type']>('battle-run/global-turn-start')
    });

    it('should run a complete global turn, then run the next one', () => {

        const actions: ServerAction[] = [];

        const on = jest.fn((action: ServerAction) => {
            actions.push(action);
        });

        // test for only ONE player
        onSendFn1 = on;

        const launchTime = timerTester.now;

        cycle = new BRCycle(players, characters, launchTime);

        let advance = 0;
        characters.forEach((c, i) => {
            const delay = i && TURN_DELAY;
            advance += cycle.globalTurn.currentTurn.turnDuration + delay;
        });
        timerTester.advanceBy(advance);

        expect(cycle.globalTurn.id).toBe(1);
        expect(cycle.globalTurn.currentTurn.id).toBe(characters.length);
        expect(cycle.globalTurn.state).toBe<GlobalTurnState>('idle');

        timerTester.advanceBy(GLOBALTURN_DELAY);

        expect(cycle.globalTurn.state).toBe<GlobalTurnState>('running');

        const actionTypes = actions.map(a => a.type);

        // note that the first global turn does not send any action
        expect(actionTypes
            .filter(t => t === 'battle-run/global-turn-start')
        ).toHaveLength(1);

        // note that the first turn of a global turn does not send any action
        expect(actionTypes
            .filter(t => t === 'battle-run/turn-start')
        ).toHaveLength(characters.length - 1);
    });
});
