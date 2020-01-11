import { TAction } from "./TAction";
import { BattleSnapshot, GlobalTurnState } from "../BattleSnapshot";
import { Position } from "../Character";

export interface BRunLaunchSAction extends TAction<'battle-run/launch'> {
    battleSnapshot: BattleSnapshot;
}

export interface BRunGlobalTurnStartSAction extends TAction<'battle-run/global-turn-start'> {
    globalTurnState: GlobalTurnState;
}

export interface ConfirmSAction extends TAction<'confirm'> {
    isOk: boolean;
}

export interface CharActionCAction extends TAction<'charAction'> {
    charAction: {
        spellId: string;
        positions: Position[];
    };
}

export type BattleRunSAction =
    | BRunLaunchSAction
    | BRunGlobalTurnStartSAction
    | ConfirmSAction;

export type BattleRunCAction =
    | CharActionCAction;