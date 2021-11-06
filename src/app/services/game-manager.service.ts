import {AppComponent} from "../app.component";

export interface TransferData {
  gameCoinAddress?: string,
  coinChainName?: string,
  gameId?: string,
  doorNumber?: number,
  wantToSwitch?: boolean
}

export interface Player {
  playerAddress?: string
  reasonForRemovalFromGame?: string,
  doorsOpenedByGame?: number[],
  hasMadeChoice?: boolean,
  selectedDoor?: number,
  wantToSwitchDoor?: boolean,
  totalPoints?: number
}

export interface GameState {
  gameId?: string,
  gameCoinAddress?: string,
  coinChainName?: string,
  gameCreator?: string,
  minPlayers?: number,
  maxPlayers?: number,
  players?: Player[],
  removedPlayers?: Player[],
  currentStage?: number,
  gameStartTime?: number,
  stageStartTime?: number,
  stageEndTime?: number,
  gameEndTime?: number,
  requiredDoorSelectionStage?: number,
  currentChoiceMakingPlayer?: number,
  gameEndReason?: string,
}

export interface AvailableGameListJSON {
  [gameId: string]: {
    gameCoinAddress: string,
    coinChainName: string,
    currentStage: number,
    gameCreator: string,
    playerAddresses: {
      [playerAddress: string]: string
    }
  }
}

export interface AvailableGame {
  gameId: string,
  playerCount: number;
}

export class GameManagerService {

  localGameCoinAddress: string = "0x64F36701138f0E85cC10c34Ea535FdBADcB54147";  // Default Value
  localCoinChainName: string = "BSC";  // Default Value

  gameState: GameState = {
    players: [],
    removedPlayers: []
  };
  availableGameList: AvailableGame[] = [];

  constructor(private appComponent: AppComponent, localGameCoinAddress?: string, localCoinChainName?: string) {
    if (localGameCoinAddress != null) {
      this.localGameCoinAddress = localGameCoinAddress;
    }

    if (localCoinChainName != null) {
      this.localCoinChainName = localCoinChainName;
    }
  }

  synchroniseGameData = (gameState: GameState) => {
    let keySet = Object.keys(gameState);
    let max: number = keySet.length;
    for (let index: number = 0; index < max; index++) {
      let key = keySet[index];
      let typeKey = <keyof GameState>key;
      this.updateEntryInGameState(typeKey, gameState[typeKey]);
    }

    this.postGameDataSynchronize();
  };

  updateEntryInGameState = <GameStateKey extends keyof GameState>(key: GameStateKey, value: GameState[GameStateKey]) => {
    this.gameState[key] = value;
  };

  postGameDataSynchronize = () => {
    if (this.gameState["currentStage"] != null && this.gameState["currentStage"] >= -1 && this.gameState["currentStage"] < 6) {
      if (this.gameState["currentStage"] < 2) {
        this.appComponent.setWindowNumberToShowTo(1);
      } else {
        this.appComponent.setWindowNumberToShowTo(2);
      }
    } else if (this.appComponent.windowNumberToShow === 1 || this.appComponent.windowNumberToShow === 2) {
      this.appComponent.setWindowNumberToShowTo(0);
    }
  };

  synchronizeAvailableGameList = (availableGameList: AvailableGameListJSON) => {
    this.availableGameList = [];

    let keySet = Object.keys(availableGameList);
    for (let i = 0; i < keySet.length; i++) {
      let typeKey = <keyof AvailableGameListJSON>keySet[i];
      if (availableGameList[typeKey].gameCoinAddress === this.localGameCoinAddress &&
        availableGameList[typeKey].coinChainName === this.localCoinChainName &&
        availableGameList[typeKey].currentStage === 0) {
        this.availableGameList.push({
          gameId: <string>typeKey,
          playerCount: Object.keys(availableGameList[typeKey].playerAddresses).length
        });
      }
    }
  };

  createNewGame = () => {
    if (!this.gameState["gameId"]) {
      let data: TransferData = {};
      if (this.localGameCoinAddress !== "") {
        data["gameCoinAddress"] = this.localGameCoinAddress;
      }
      if (this.localCoinChainName !== "") {
        data["coinChainName"] = this.localCoinChainName;
      }

      this.appComponent.socketIOService.emitEventToServer('createNewGame', data);
    }
  };

  getAvailableGameList = () => {
    this.appComponent.socketIOService.emitEventToServer("getAvailableGameList", {});
  };

  addPlayerToGame = (gameId: string) => {
    if (!this.gameState["gameId"]) {
      let data: TransferData = {
        gameId: gameId
      };

      this.appComponent.socketIOService.emitEventToServer('addPlayerToGame', data);
    }
  };

  beginGameEarly = () => {
    if (this.gameState["gameId"]) {
      if (this.appComponent.web3Service.userAccount !== this.gameState["gameCreator"] || !this.gameState["players"] ||
        !this.gameState["minPlayers"] || this.gameState["players"].length < this.gameState["minPlayers"]) {
        this.appComponent.popNewPopUp("Only the game creator can begin the game early when at least " +
          this.gameState.minPlayers + " players have joined the game.", 5000);
        return;
      }
      let data: TransferData = {
        gameId: this.gameState["gameId"]
      };

      this.appComponent.socketIOService.emitEventToServer("beginGameEarly", data);
    }
  };

  sendPlayerDoorSelection = (doorNumber: number) => {
    if (this.gameState["gameId"] && this.gameState["currentChoiceMakingPlayer"] != null &&
      this.gameState["players"] != null && this.gameState.currentStage != null) {
      if ((this.gameState.currentStage === 2 || this.gameState.currentStage === 4) &&
        this.gameState["players"][this.gameState.currentChoiceMakingPlayer].playerAddress === this.appComponent.web3Service.userAccount) {
        let data: TransferData = {
          gameId: this.gameState["gameId"],
          doorNumber: doorNumber
        };

        this.appComponent.socketIOService.emitEventToServer('acceptPlayerInput', data);
      } else {
        this.appComponent.popNewPopUp("You are not allowed to make the choice right now.", 3000);
      }
    }
  };

  sendPlayerSwitchSelection = (wantToSwitch: boolean) => {
    if (this.gameState["gameId"] && this.gameState["currentChoiceMakingPlayer"] != null &&
      this.gameState["players"] != null && this.gameState.currentStage != null) {
      if (this.gameState.currentStage === 3 &&
        this.gameState["players"][this.gameState.currentChoiceMakingPlayer].playerAddress === this.appComponent.web3Service.userAccount) {
        let data: TransferData = {
          gameId: this.gameState["gameId"],
          wantToSwitch: wantToSwitch
        };

        this.appComponent.socketIOService.emitEventToServer('acceptPlayerInput', data);
      }
    } else {
      this.appComponent.popNewPopUp("You are not allowed to make the choice right now.", 3000);
    }
  };

  resetGameState = () => {
    this.gameState = {
      players: [],
      removedPlayers: []
    }
  };
}
