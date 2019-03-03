# common-services
A module that provides access to common services.

## Updating this README.md
Run `npm run generateReadme` to parse the code for JSDoc comment blocks and recreate this README.md file.

## Install
Run `npm i @pillarwallet/common-services`

## Examples
Instantiate a badges service: <br />
@param - (required) Network provider (mainnet, ropsten, localhost, docker-ganache)<br />
@param - (required) Smart contract address<br />
@param - (required) Private key to operate with the contract<br />
@param - (optional) Specify the file path to which log records are written<br />
@param - (optional - default false). Set true to enable logging to a file and file rotation<br />

```javascript
const { buildBadgeService } = require('@pillarwallet/common-services');

const BadgeService = buildBadgeService({
  networkProvider: 'ropsten',
  smartContractAddress: '0x...',
  privateKey: '',
  loggerPath: '',
  logToFile: false,
});
const tx = await BadgeService.mintBadge();

# API

## Members

<dl>
<dt><a href="#Constructor">Constructor</a> ⇒</dt>
<dd><p>This is the constructor of the BadgeService instance.
It allows to set the Configuration keys:</p>
</dd>
<dt><a href="#awardBadge">awardBadge</a> ⇒</dt>
<dd><p>Award ethereum address with a badge</p>
</dd>
<dt><a href="#massBadgeAward">massBadgeAward</a> ⇒</dt>
<dd><p>Award multiple ethereum addresses with a badge</p>
</dd>
<dt><a href="#onUserRegistered">onUserRegistered</a> ⇒</dt>
<dd><p>Method that awards user with a badge for the registration</p>
</dd>
<dt><a href="#onWalletImported">onWalletImported</a> ⇒</dt>
<dd><p>Method that awards user with a badge for the imported wallet</p>
</dd>
<dt><a href="#onConnectionEstablished">onConnectionEstablished</a> ⇒</dt>
<dd><p>Method that awards user with a badge for the first connection</p>
</dd>
<dt><a href="#onFirstTransactionMade">onFirstTransactionMade</a> ⇒</dt>
<dd><p>Method that awards user with a badge for the first transaction made</p>
</dd>
<dt><a href="#onFirstTransactionReceived">onFirstTransactionReceived</a> ⇒</dt>
<dd><p>Method that awards user with a badge for the first transaction received</p>
</dd>
<dt><a href="#selfAward">selfAward</a> ⇒</dt>
<dd><p>Method to award yourself with a badge</p>
</dd>
<dt><a href="#checkTxStatus">checkTxStatus</a> ⇒</dt>
<dd><p>Get transaction status</p>
</dd>
<dt><a href="#mintBadge">mintBadge</a> ⇒</dt>
<dd><p>Mint a badge</p>
</dd>
</dl>

<a name="Constructor"></a>

## Constructor ⇒
This is the constructor of the BadgeService instance.
It allows to set the Configuration keys:

**Kind**: global variable  
**Returns**: Object<BadgeService>  

| Param | Type | Description |
| --- | --- | --- |
| [networkProvider] | <code>String</code> | Set the network provider (mainnet, ropsten, localhost, docker-ganache) |
| [smartContractAddress] | <code>String</code> | Set the smart contract address |
| [privateKey] | <code>String</code> | Set the private key to operate with the contract |
| [loggerPath] | <code>String</code> | Specify the file path to which log records are written |
| [logToFile] | <code>Boolean</code> | Enables logging to a file and file rotation |

<a name="awardBadge"></a>

## awardBadge ⇒
Award ethereum address with a badge

**Kind**: global variable  
**Returns**: Promise<TransactionDetails>  

| Param | Type | Description |
| --- | --- | --- |
| [badgeEthereumId] | <code>Number</code> | Badge ID in the smart contract |
| [userEthereumAddress] | <code>String</code> | Ethereum address to award |

<a name="massBadgeAward"></a>

## massBadgeAward ⇒
Award multiple ethereum addresses with a badge

**Kind**: global variable  
**Returns**: Promise<TransactionDetails>  

| Param | Type | Description |
| --- | --- | --- |
| [badgeEthereumId] | <code>Number</code> | Badge ID in the smart contract |
| [usersEthereumAddresses] | <code>String</code> | Ethereum addresses to award |

<a name="onUserRegistered"></a>

## onUserRegistered ⇒
Method that awards user with a badge for the registration

**Kind**: global variable  
**Returns**: Promise<MongoDBObject>  

| Param | Type | Description |
| --- | --- | --- |
| [walletId] | <code>String</code> | Wallet ID |
| [userId] | <code>String</code> | User ID |
| [ethAddress] | <code>String</code> | User's Ethereum address |

<a name="onWalletImported"></a>

## onWalletImported ⇒
Method that awards user with a badge for the imported wallet

**Kind**: global variable  
**Returns**: Promise<MongoDBObject>  

| Param | Type | Description |
| --- | --- | --- |
| [walletId] | <code>String</code> | Wallet ID |
| [userId] | <code>String</code> | User ID |
| [ethAddress] | <code>String</code> | User's Ethereum address |

<a name="onConnectionEstablished"></a>

## onConnectionEstablished ⇒
Method that awards user with a badge for the first connection

**Kind**: global variable  
**Returns**: Promise<MongoDBObject>  

| Param | Type | Description |
| --- | --- | --- |
| [walletId] | <code>String</code> | Wallet ID |
| [userId] | <code>String</code> | User ID |
| [ethAddress] | <code>String</code> | User's Ethereum address |

<a name="onFirstTransactionMade"></a>

## onFirstTransactionMade ⇒
Method that awards user with a badge for the first transaction made

**Kind**: global variable  
**Returns**: Promise<MongoDBObject>  

| Param | Type | Description |
| --- | --- | --- |
| [walletId] | <code>String</code> | Wallet ID |
| [userId] | <code>String</code> | User ID |
| [ethAddress] | <code>String</code> | User's Ethereum address |

<a name="onFirstTransactionReceived"></a>

## onFirstTransactionReceived ⇒
Method that awards user with a badge for the first transaction received

**Kind**: global variable  
**Returns**: Promise<MongoDBObject>  

| Param | Type | Description |
| --- | --- | --- |
| [walletId] | <code>String</code> | Wallet ID |
| [userId] | <code>String</code> | User ID |
| [ethAddress] | <code>String</code> | User's Ethereum address |

<a name="selfAward"></a>

## selfAward ⇒
Method to award yourself with a badge

**Kind**: global variable  
**Returns**: Promise<MongoDBObject>  

| Param | Type | Description |
| --- | --- | --- |
| [badgeType] | <code>String</code> | Badge name |
| [walletId] | <code>String</code> | Wallet ID |
| [userId] | <code>String</code> | User ID |
| [ethAddress] | <code>String</code> | User's Ethereum address |

<a name="checkTxStatus"></a>

## checkTxStatus ⇒
Get transaction status

**Kind**: global variable  
**Returns**: Promise<TransactionStatus>  

| Param | Type | Description |
| --- | --- | --- |
| [txHash] | <code>String</code> | Transaction hash that you want to check |

<a name="mintBadge"></a>

## mintBadge ⇒
Mint a badge

**Kind**: global variable  
**Returns**: Promise<TransactionDetails>  

| Param | Type | Description |
| --- | --- | --- |
| [tokenSupply - default 0] | <code>Number</code> | Maximum supply of a new badge, set 0 for unlimited |
| [isTransferable - default false] | <code>Boolean</code> | Specify if a user could transfer this badge to other users |


