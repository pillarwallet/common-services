# common-services
A module that provides access to common services.

## Updating this README.md
Run `npm run generateReadme` to parse the code for JSDoc comment blocks and recreate this README.md file.

## Install
Run `npm i @pillarwallet/common-services`

## Examples
Instantiate a badges service: <br />
@param - (loggerPath - optional) Specify the file path to which log records are written<br />
@param - (logToFile - optional - default false). Set true to enable logging to a file and file rotation<br />
@param - (dbModels - optional) Pass the Badge and BadgeAward mongoose objects (need for the backend integration)<br />

```javascript
const { Badge, BadgeAward } = require('@pillarwallet/common-models').platform;
const { buildBadgeService } = require('@pillarwallet/common-services');

const BadgeService = buildBadgeService({
  loggerPath: '',
  logToFile: false,
  dbModels: { Badge, BadgeAward },
});
```

Instantiate a notification service: <br />
@param - (sqsConfiguration - required) Pass the SQS configuration object<br />
@param - (dbModels - optional) Pass the Badge mongoose object (need for the backend integration)<br />

```javascript
const config = require('../../src/config');
const { Badge } = require('@pillarwallet/common-models').platform;
const { buildNotificationService } = require('@pillarwallet/common-services');

const notificationService = buildNotificationService({
  sqsConfiguration: { region: 'us-east-1', queueUrl: 'https://sqs.us-east-1.amazonaws.com/testing/test.fifo', fifoQueue: true },
  dbModels: { Badge },
});
```

# API

## Members

<dl>
<dt><a href="#Constructor">Constructor</a> ⇒</dt>
<dd><p>This is the constructor of the BadgeService instance.
It allows to set the Configuration keys:</p>
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
<dt><a href="#onTransactionMade">onTransactionMade</a> ⇒</dt>
<dd><p>Method that awards user with a badge for the first transaction made</p>
</dd>
<dt><a href="#onTransactionReceived">onTransactionReceived</a> ⇒</dt>
<dd><p>Method that awards user with a badge for the first transaction received</p>
</dd>
<dt><a href="#selfAward">selfAward</a> ⇒</dt>
<dd><p>Method to award yourself with a badge</p>
</dd>
<dt><a href="#Constructor">Constructor</a> ⇒</dt>
<dd><p>This is the constructor of the NotificationService instance.</p>
</dd>
<dt><a href="#retryMessage">retryMessage</a></dt>
<dd><p>Method to log error and call method sendMessage if corresponds</p>
</dd>
<dt><a href="#sendMessage">sendMessage</a></dt>
<dd><p>Method to send a message to SQS</p>
</dd>
<dt><a href="#createBadgesNotification">createBadgesNotification</a></dt>
<dd><p>Method that creates a Badge notification and put the message in SQS</p>
</dd>
<dt><a href="#onUserRegisteredBadgeNotification">onUserRegisteredBadgeNotification</a></dt>
<dd><p>Method that creates badge notification with type: wallet-created</p>
</dd>
<dt><a href="#onWalletImportedBadgeNotification">onWalletImportedBadgeNotification</a></dt>
<dd><p>Method that creates badge notification with type: wallet-imported</p>
</dd>
<dt><a href="#onConnectionEstablishedBadgeNotification">onConnectionEstablishedBadgeNotification</a></dt>
<dd><p>Method that creates badge notification with type: first-connection-established</p>
</dd>
<dt><a href="#onTransactionMadeBadgeNotification">onTransactionMadeBadgeNotification</a></dt>
<dd><p>Method that creates badge notification with type: first-transaction-made</p>
</dd>
<dt><a href="#onTransactionReceivedBadgeNotification">onTransactionReceivedBadgeNotification</a></dt>
<dd><p>Method that creates badge notification with type: first-transaction-received</p>
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
| [loggerPath] | <code>String</code> | Specify the file path to which log records are written |
| [logToFile] | <code>Boolean</code> | Enables logging to a file and file rotation |
| [dbModels] | <code>Object</code> | Pass the Badge and BadgeAward mongoose objects |

<a name="onUserRegistered"></a>

## onUserRegistered ⇒
Method that awards user with a badge for the registration

**Kind**: global variable  
**Returns**: Promise<MongoDBObject>  

| Param | Type | Description |
| --- | --- | --- |
| [walletId] | <code>String</code> | Wallet ID |
| [userId] | <code>String</code> | User ID |

<a name="onWalletImported"></a>

## onWalletImported ⇒
Method that awards user with a badge for the imported wallet

**Kind**: global variable  
**Returns**: Promise<MongoDBObject>  

| Param | Type | Description |
| --- | --- | --- |
| [walletId] | <code>String</code> | Wallet ID |
| [userId] | <code>String</code> | User ID |

<a name="onConnectionEstablished"></a>

## onConnectionEstablished ⇒
Method that awards user with a badge for the first connection

**Kind**: global variable  
**Returns**: Promise<MongoDBObject>  

| Param | Type | Description |
| --- | --- | --- |
| [walletId] | <code>String</code> | Wallet ID |
| [userId] | <code>String</code> | User ID |

<a name="onTransactionMade"></a>

## onTransactionMade ⇒
Method that awards user with a badge for the first transaction made

**Kind**: global variable  
**Returns**: Promise<MongoDBObject>  

| Param | Type | Description |
| --- | --- | --- |
| [walletId] | <code>String</code> | Wallet ID |
| [userId] | <code>String</code> | User ID |

<a name="onTransactionReceived"></a>

## onTransactionReceived ⇒
Method that awards user with a badge for the first transaction received

**Kind**: global variable  
**Returns**: Promise<MongoDBObject>  

| Param | Type | Description |
| --- | --- | --- |
| [walletId] | <code>String</code> | Wallet ID |
| [userId] | <code>String</code> | User ID |

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

<a name="Constructor"></a>

## Constructor ⇒
This is the constructor of the NotificationService instance.

**Kind**: global variable  
**Returns**: Object<NotificationService>  

| Param | Type | Description |
| --- | --- | --- |
| [sqsConfiguration] | <code>Object</code> | SQS configuration object |
| [dbModels] | <code>Object</code> | Pass the Badge mongoose object |

<a name="retryMessage"></a>

## retryMessage
Method to log error and call method sendMessage if corresponds

**Kind**: global variable  
<a name="sendMessage"></a>

## sendMessage
Method to send a message to SQS

**Kind**: global variable  

| Param | Type | Description |
| --- | --- | --- |
| [message] | <code>Object</code> | The message object |

<a name="createBadgesNotification"></a>

## createBadgesNotification
Method that creates a Badge notification and put the message in SQS

**Kind**: global variable  

| Param | Type | Description |
| --- | --- | --- |
| [wallet] | <code>Object</code> | The wallet object from the recipient user |

<a name="onUserRegisteredBadgeNotification"></a>

## onUserRegisteredBadgeNotification
Method that creates badge notification with type: wallet-created

**Kind**: global variable  

| Param | Type | Description |
| --- | --- | --- |
| [wallet] | <code>Object</code> | The wallet object from the recipient user |

<a name="onWalletImportedBadgeNotification"></a>

## onWalletImportedBadgeNotification
Method that creates badge notification with type: wallet-imported

**Kind**: global variable  

| Param | Type | Description |
| --- | --- | --- |
| [wallet] | <code>Object</code> | The wallet object from the recipient user |

<a name="onConnectionEstablishedBadgeNotification"></a>

## onConnectionEstablishedBadgeNotification
Method that creates badge notification with type: first-connection-established

**Kind**: global variable  

| Param | Type | Description |
| --- | --- | --- |
| [wallet] | <code>Object</code> | The wallet object from the recipient user |

<a name="onTransactionMadeBadgeNotification"></a>

## onTransactionMadeBadgeNotification
Method that creates badge notification with type: first-transaction-made

**Kind**: global variable  

| Param | Type | Description |
| --- | --- | --- |
| [wallet] | <code>Object</code> | The wallet object from the recipient user |

<a name="onTransactionReceivedBadgeNotification"></a>

## onTransactionReceivedBadgeNotification
Method that creates badge notification with type: first-transaction-received

**Kind**: global variable  

| Param | Type | Description |
| --- | --- | --- |
| [wallet] | <code>Object</code> | The wallet object from the recipient user |


test
