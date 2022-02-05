import { discoverAddresses, getAddress } from "../ergo-related/ergolibUtils";
import { errorAlert, successAlert } from './Alerts';
import { addressHasTransactions, getBalanceForAddress, getTransactionsForAddress, getUnconfirmedTxsFor } from "../ergo-related/explorer";
import { MAX_NUMBER_OF_UNUSED_ADDRESS_PER_ACCOUNT, NANOERG_TO_ERG, PASSWORD_SALT } from "./constants";
import '@sweetalert2/theme-dark/dark.css';
import { enrichUtxos } from "../ergo-related/utxos";
var CryptoJS = require("crypto-js");


export const MIN_CHAR_WALLET_NAME = 3;
export const MIN_CHAR_WALLET_PASSWORD = 10;
export const INVALID_PASSWORD_LENGTH_MSG = "Min " + MIN_CHAR_WALLET_PASSWORD.toString() + " characters !";
export const INVALID_NAME_LENGTH_MSG = "Min " + MIN_CHAR_WALLET_NAME.toString() + " characters !";

export function isValidPassword(password) {
    console.log(password, password.length);
    if (password.length < MIN_CHAR_WALLET_PASSWORD) {
        return false;
    }
    return true;
}

export async function addNewWallet(name, mnemonic, password, color) {
    const walletAccounts = await discoverAddresses(mnemonic);
    console.log("walletAccounts", walletAccounts, walletAccounts[0].addresses[0].address);
    const newWallet = {
        name: name,
        mnemonic: CryptoJS.AES.encrypt(mnemonic, password + PASSWORD_SALT).toString(),
        accounts: walletAccounts,
        color: color,
        changeAddress: walletAccounts[0].addresses[0].address,
    };
    var walletList = JSON.parse(localStorage.getItem('walletList'));
    walletList.push(newWallet);
    localStorage.setItem('walletList', JSON.stringify(walletList));
    return walletList.length;
}

export function getWalletById(id) {
    const walletList = JSON.parse(localStorage.getItem('walletList'));
    return walletList[id];
}

export function updateWallet(wallet, id) {
    var walletList = JSON.parse(localStorage.getItem('walletList'));
    walletList[id] = wallet;
    localStorage.setItem('walletList', JSON.stringify(walletList));
}

export function addWallet(wallet) {
    var walletList = JSON.parse(localStorage.getItem('walletList'));
    walletList.push(wallet);
    localStorage.setItem('walletList', JSON.stringify(walletList));
}

export function deleteWallet(walletId) {
    var walletList = JSON.parse(localStorage.getItem('walletList'));
    var newWalletList = walletList.filter((wallet, id) => id !== walletId);
    localStorage.setItem('walletList', JSON.stringify(newWalletList));
}

export function changePassword(encryptedMnemonic, oldPassword, newPassword) {
    return CryptoJS.AES.encrypt(CryptoJS.AES.decrypt(encryptedMnemonic, oldPassword + PASSWORD_SALT).toString(CryptoJS.enc.Utf8), newPassword + PASSWORD_SALT).toString();
}



// return formatted token amount like 6,222,444.420
// amountInt: number of token as provided in utxo (to be divided by 10^decimals)
// decimalsInt: number of decimals of the token
export function formatTokenAmount(amountInt, decimalsInt, trimTrailing0 = true) {
    if (decimalsInt > 0) {
        const numberAmount = (Number(amountInt) / Number(Math.pow(10, parseInt(decimalsInt)))).toFixed(parseInt(decimalsInt));
        //const strAmount = amountInt.toString();
        //const numberAmount = strAmount.substring(0, parseInt(decimalsInt)-1) + "." + strAmount.substring(parseInt(decimalsInt)-1);
        var str = numberAmount.toString().split(".");
        str[0] = str[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        if (trimTrailing0) { str[1] = str[1].replace(/0+$/g, "") };
        if (str[1].length > 0) {
            return str.join(".");
        } else {
            return str[0]
        }
        
    } else {
        return amountInt.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ",");
    }
}

export function formatTokenAmount__(amountInt, decimalsInt) {
    if (decimalsInt > 0) {
        const numberAmount = (Number(amountInt)/Number(Math.pow(10, parseInt(decimalsInt)))).toFixed(parseInt(decimalsInt));
        var str = numberAmount.toString().split(".");
        str[0] = str[0].replace(/\B(?=(\d{3})+(?!\d))/g, ",");
        return str.join(".");
    } else {
        return amountInt.replace(/\B(?=(\d{3})+(?!\d))/g, ",");;
    }
}

export function formatERGAmount(amountStr) {
    return parseFloat(parseInt(amountStr) / NANOERG_TO_ERG).toFixed(4);
}

export function formatLongString(str, num) {
    if (typeof str !== 'string') return str;
    if (str.length > 2 * num) {
        return str.substring(0, num) + "..." + str.substring(str.length - num, str.length);
    } else {
        return str;
    }
}

export function getWalletNames() {
    const walletList = JSON.parse(localStorage.getItem('walletList'));
    return walletList.map((wallet) => wallet.name);
}

export function getOtherWalletNames(walletId) {
    const walletList = JSON.parse(localStorage.getItem('walletList'));
    return walletList.filter((wallet, id) => id !== walletId).map((wallet) => wallet.name);
}

export function getWalletAddressList(wallet) {
    let addressList = [];
    for (var account of wallet.accounts) {
        for (var address of account.addresses) {
            addressList.push(address.address);
        }
    }
    return addressList;
}
export function getWalletUsedAddressList(wallet) {
    let addressList = [];
    for (var account of wallet.accounts) {
        for (var address of account.addresses) {
            if (address.used) {
                addressList.push(address.address);
            }
        }
    }
    return addressList;
}
function getConnectedWalletName(url) {
    const connectedSites = JSON.parse(localStorage.getItem('connectedSites')) ?? {};
    for (const walletName of Object.keys(connectedSites)) {
        if (connectedSites[walletName].includes(url)) {
            return walletName;
        }
    }
    return null;
}
export function getConnectedWalletByURL(url) {
    const walletName = getConnectedWalletName(url);
    if (walletName !== null) {
        const walletList = JSON.parse(localStorage.getItem('walletList')) ?? [];
        for (const wallet of walletList) {
            if (wallet.name === walletName) {
                return wallet;
            }
        }
    }
    return null;
}

export function getWalletListAddressList(walletList) {
    let walletListAddressList = [];
    for (var wallet of walletList) {
        walletListAddressList.push(getWalletAddressList(wallet));
    }
    return walletListAddressList
}

export function getAccountAddressList(account) {
    return account.addresses.map((addr) => addr.address);
}

export function getLastAccountId(wallet) {
    return wallet.accounts.length - 1;
}

export async function lastAccountHasTransaction(wallet) {
    const lastAccountId = getLastAccountId(wallet);
    const lastAccountAddressList = getAccountAddressList(wallet.accounts[lastAccountId]);
    var txFound = false;
    for (const addr of lastAccountAddressList) {
        if (await addressHasTransactions(addr)) {
            txFound = true;
            break;
        }
    }
    return txFound;
}

export function decryptMnemonic(mnemonicCrypted, password) {
    if (password === null) {
        return null;
    }
    var mnemonic = '';
    try {
        mnemonic = CryptoJS.AES.decrypt(mnemonicCrypted, password + PASSWORD_SALT).toString(CryptoJS.enc.Utf8);
    } catch (e) {
        console.log(e);
        return '';
    }
    return mnemonic;
}

export function passwordIsValid(mnemonicCrypted, password) {
    try {
        const mnemonic = CryptoJS.AES.decrypt(mnemonicCrypted, password + PASSWORD_SALT).toString(CryptoJS.enc.Utf8);
        if (mnemonic.length < 10) {
            return false;
        }
        return true;
    } catch (e) {
        return false;
    }
}

export function setAccountName(walletId, accountId, accountName) {
    console.log("setAccountName", walletId, accountId, accountName);
    var wallet = getWalletById(walletId);
    wallet.accounts.find(account => account.id == accountId)["name"] = accountName;
    updateWallet(wallet, walletId);
}

export function setAddressUsed(addressToSet) {
    var walletList = JSON.parse(localStorage.getItem('walletList'));
    for (var k in walletList){
        var newWallet = {...walletList[k]};
        for (var i in newWallet.accounts) {
            var account = newWallet.accounts[i];
            for(var j in account.addresses) {
                var addr = account.addresses[j];
                if (addr.address === addressToSet) {
                    newWallet.accounts[i].addresses[j].used = true;
                    updateWallet(newWallet,k);
                }
            }
        }
    }
}

export function setChangeAddress(walletId, address) {
    var wallet = getWalletById(walletId);
    wallet.changeAddress = address;
    updateWallet(wallet, walletId);
}

export async function getAddressListContent(addressList) {
    const addressContentList = await Promise.all(addressList.map(async (address) => {
        const addressContent = await getBalanceForAddress(address);
        console.log("getAddressListContent", address, addressContent, JSON.stringify(addressContent))
        return { address: address, content: addressContent.confirmed, unconfirmed: { ...addressContent.unconfirmed } };
    }));
    return addressContentList;
}

export async function getTransactionsForAddressList(addressList, limit) {
    const addressTransactionsList = await Promise.all(addressList.map(async (address) => {
        const addressTransactions = await getTransactionsForAddress(address, limit);
        //console.log("addressTransactions", address, addressTransactions)
        return { address: address, transactions: addressTransactions.items, total: addressTransactions.total };
    }));
    return addressTransactionsList;
}

export async function getUnconfirmedTransactionsForAddressList(addressList, enrich = true) {
    const addressUnConfirmedTransactionsList = await Promise.all(addressList.map(async (address) => {
        var addressTransactions = await getUnconfirmedTxsFor(address);
        console.log("getUnconfirmedTransactionsForAddressList", address, addressTransactions);
        if (enrich) {
            try { // if we fail to fetch one box, skip the unconfirmed transactions for that address
                for (const tx of addressTransactions) {
                    tx.inputs = await enrichUtxos(tx.inputs);
                }
                return { address: address, transactions: addressTransactions };
            } catch(e) {
                console.log(e);
                return { address: address, transactions: [] };
            }
        } else  {
            return { address: address, transactions: addressTransactions };
        }
    }));
    return addressUnConfirmedTransactionsList;
}

export function getSummaryFromAddressListContent(addressContentList) {
    const addressList = addressContentList.map(addrContent => addrContent.address);
    const selectedAddressList = new Array(addressList.length).fill(true);
    return getSummaryFromSelectedAddressListContent(addressList, addressContentList, selectedAddressList);
}

export function getSummaryFromSelectedAddressListContent(addressList, addressContentList, selectedAddressList) {
    var nanoErgs = 0, tokens = [], nanoErgsUnconfirmed = 0, tokensUnconfirmed = [];
    //console.log("getSummaryFromSelectedAddressListContent0", addressList, addressContentList, selectedAddressList)
    for (const i in addressList) {
        if (selectedAddressList[i]) {
            const addrInfo = { ...addressContentList[i].content };
            //const addrUnconfirmedInfo = {...addressContentList[i].unconfirmed};
            //console.log("getSummaryFromSelectedAddressListContent adding", addressList[i], addrInfo)

            nanoErgs += addrInfo.nanoErgs;
            //nanoErgsUnconfirmed += addrUnconfirmedInfo.nanoErgs;
            if (Array.isArray(addrInfo.tokens)) {
                for (var token of addrInfo.tokens) {
                    //if (addressList.includes(addrInfo.address)) {
                    const tokIndex = tokens.findIndex(e => (e.tokenId === token.tokenId));
                    if (tokIndex >= 0) {
                        //console.log("getSummaryFromSelectedAddressListContent adding", i, addressList[i], token.tokenId, token.amount)
                        tokens[tokIndex].amount += token.amount;
                    } else {
                        tokens.push({ ...token });
                    }
                    //}
                }
            }
            //console.log("getSummaryFromSelectedAddressListContent", JSON.stringify(addressContentList[i],null,2));
            //if (Array.isArray(addrUnconfirmedInfo.tokens)) {
            //    for (var token of addrUnconfirmedInfo.tokens) {
            //        const tokIndex = tokensUnconfirmed.findIndex(e => (e.tokenId === token.tokenId));
            //        if (tokIndex >= 0) {
            //            tokensUnconfirmed[tokIndex].amount += token.amount;
            //        } else {
            //            tokensUnconfirmed.push(token);
            //        }
            //    }
            //}
            //console.log("getSummaryFromSelectedAddressListContent2", JSON.stringify(addressContentList[i], null, 2));
        }
    }
    //console.log("getSummaryFromSelectedAddressListContent3", nanoErgs, tokens, JSON.stringify(addressContentList));
    return [nanoErgs, tokens]
}

