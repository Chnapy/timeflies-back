import { BTurn, TurnState } from "./BTurn";
import { seedBCharacter } from "../../../../__seeds__/seedBCharacter";
import { BCharacter } from "../../entities/BCharacter";
import { TimerTester } from '../../../../__testUtils__/TimerTester';

describe('#BTurn', () => {

    const timerTester = new TimerTester();

    let character: BCharacter;

    beforeEach(() => {
        timerTester.beforeTest();
        character = seedBCharacter({
            length: 1,
            alterFn: (char) => char.initialFeatures.actionTime = 2000
        })[ 0 ];
    });

    afterEach(() => {
        timerTester.afterTest();
    });

    it('should not have timed actions on init', () => {
        const callback = jest.fn();

        const turnIdle = new BTurn(1, timerTester.now - 100000, character, callback, callback);

        expect(callback).not.toHaveBeenCalled();
    });

    it('should always have coherent state', () => {

        const startTimes = {
            past: timerTester.now - 1000,
            future: timerTester.now + 1000,
            wayBefore: timerTester.now - 5000
        };

        const turnIdle = new BTurn(1, startTimes.future, character, () => null, () => null);
        const turnRunning = new BTurn(1, startTimes.past, character, () => null, () => null);
        const turnEnded = new BTurn(1, startTimes.wayBefore, character, () => null, () => null);

        const states: TurnState[] = [ 'idle', 'running', 'ended' ];

        expect(turnIdle.state).toBe(states[ 0 ]);
        expect(turnRunning.state).toBe(states[ 1 ]);
        expect(turnEnded.state).toBe(states[ 2 ]);
    });

    it('should run start callback at creation', () => {

        const startTime = timerTester.now;

        const startFn = jest.fn();

        const turnIdle = new BTurn(1, startTime, character, startFn, () => {});
        turnIdle.refreshTimedActions();

        expect(startFn).toHaveBeenCalled();
    });

    it('should run callbacks at expected time', () => {

        const now = timerTester.now;

        const startTime = now + 1000;

        const startFn = jest.fn();
        const endFn = jest.fn();

        const turnIdle = new BTurn(1, startTime, character, startFn, endFn);
        turnIdle.refreshTimedActions();

        timerTester.advanceBy(900);

        expect(startFn).not.toHaveBeenCalled();

        timerTester.advanceBy(200);

        // 1100

        expect(startFn).toHaveBeenCalled();

        timerTester.advanceBy(1700);

        // 2800

        expect(endFn).not.toHaveBeenCalled();

        timerTester.advanceBy(500);

        // 3300

        expect(endFn).toHaveBeenCalledTimes(1);
        expect(startFn).toHaveBeenCalledTimes(1);

    });

});
