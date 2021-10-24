import {AppComponent} from "./app.component";

export class Web3Service {

  web3BuildSuccess: boolean = false;
  appComponent: AppComponent;
  web3 = window.web3;
  userAccount: string = "";

  constructor(appComponent: AppComponent) {
    this.appComponent = appComponent;
    if (this.web3 != null) {
      window.ethereum.on('accountsChanged', this.setUserAccount);

      window.ethereum.on('chainChanged', () => {
        window.location.reload();
      });

      window.ethereum.request({method: 'eth_requestAccounts'}).then((accList: string[]) => {
        this.setUserAccount(accList);
        this.web3BuildSuccess = true;
        console.log("Successfully Connected to Web3 Service");
      }).catch((err: any) => {
        console.log("Web3 Access Denied : " + ((typeof err == 'object') ? JSON.stringify(err) : err));
      });
    } else {
      this.web3BuildSuccess = false;
    }
  }

  setUserAccount = (accList: string[]) => {
    this.userAccount = this.web3.utils.toChecksumAddress(accList[0]);
    this.appComponent.bindPlayerAddress();
    console.log("User Account Changed to : " + this.userAccount);
  };

  requestSignatureFromUser = async (messageToSign: string) => {
    if (this.web3BuildSuccess) {
      try {
        return await this.web3.eth.personal.sign(messageToSign, this.userAccount, "Unnecessary Dummy Parameter");
      } catch (err) {
        return null;
      }
    } else {
      return null;
    }
  }
}
