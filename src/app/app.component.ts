import {Component} from '@angular/core';
import {SocketIOService} from './services/socket-io.service'
import {Web3Service} from "./services/web3.service";

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'Lucky-Gates-Bot';

  socketIOService: SocketIOService = new SocketIOService(this);
  web3Service: Web3Service = new Web3Service(this);

  constructor() { }

  bindPlayerAddress = () => {
    if (this.web3Service.userAccount !== "" && this.socketIOService.signCode !== "") {
      this.web3Service.requestSignatureFromUser(this.socketIOService.signCode).then((signedMessage) => {
        if (signedMessage != null) {
          this.socketIOService.emitEventToServer("bindAddress", {
            "playerAddress": this.web3Service.userAccount,
            "signedMessage": signedMessage
          });
        }
      });
    }
  }

  canLoadMainMenu = () => {
    return this.socketIOService.signCode !== "" && this.web3Service.web3BuildSuccess;
  }
}
