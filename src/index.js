require('dotenv').config();

const restify = require('restify');
const errors  = require('restify-errors');
const logger  = require('morgan');
const api     = require('./mtproto.js');
const { MTProto } = require('@mtproto/core');

const Storage = require('node-localstorage').LocalStorage;

class TempLocalStorage {
    constructor(team_robot_id) {
        this.storage = new Storage('./auth_storage/team_robot_id_' + team_robot_id + '-auth');
    }

    setItem(key, value) {
      return this.storage.setItem(key, value);
    }

    getItem(key) {
      return this.storage.getItem(key);
    }
}


/**
  * Initialize server
  */
const server = restify.createServer();

/**
 * Middlewares
 */
// server.use(restify.plugins.jsonp());
server.use(logger('dev'));
server.use(restify.plugins.queryParser());
server.pre(restify.plugins.pre.dedupeSlashes());

/**
  * Services
  */
const sendCode = async (team_robot_id, phone) => {
    let tempLocalStorage = new TempLocalStorage(team_robot_id);

    let sendCodeReq = await api.call(tempLocalStorage, 'auth.sendCode', {
        phone_number: phone,
        settings: {
            _: 'codeSettings',
        },
    });

    return sendCodeReq;
};

const signIn = async (team_robot_id, phone, code, phone_code_hash) => {
    let tempLocalStorage = new TempLocalStorage(team_robot_id);

    let signInReq = await api.call(tempLocalStorage, 'auth.signIn', {
        phone_number:    phone,
        phone_code:      code,
        phone_code_hash: phone_code_hash,
    });z

    return signInReq;
}

const getChannels = async (team_robot_id) => {
    let tempLocalStorage = new TempLocalStorage(team_robot_id);

    let chats = await api.call(
        tempLocalStorage,
        'messages.getAllChats',
        { except_ids: [] },
    );
    console.log(chats);

    let channels = chats.chats.filter( chat => chat._ === 'channel' && chat.admin_rights );
    channels.forEach( channel => {
            delete channel.pFlags;
            delete channel.version;
            delete channel.default_banned_rights;
            delete channel.photo;
            delete channel.admin_rights;
            delete channel.flags;
            delete channel._;
        }
    );

    return channels;
}

const getChannelContacts = async (team_robot_id, channel_id, access_hash, offset) => {

    let tempLocalStorage = new TempLocalStorage(team_robot_id);

    let channel_members_req = await api.call(
        tempLocalStorage,
        'channels.getParticipants',
        {
            offset: offset,
            limit:  100,
            channel: {
                _ : 'inputChannel',
                channel_id: channel_id,
                access_hash: access_hash
            },
            filter: { _ : 'channelParticipantsRecent' }
        },
    );

    let members = channel_members_req.users;

    return members;
};

/**
  * Routes
  */
server.post('/send-code', async (req, res, next) => {
    const { team_robot_id, phone } = req.query;

    try {
        const data = await sendCode(team_robot_id, phone);
        res.send(data);
        return next();
    } catch (err) {
        console.log(err);
        return next(new errors.InternalServerError('Internal server error'));
    }
});

server.post('/sign-in', async (req, res, next) => {
    const { team_robot_id, phone, code, phone_code_hash  } = req.query;

    try {
        const data = await signIn(team_robot_id, phone, code, phone_code_hash);
        res.send(data);
        return next();
    } catch (err) {
        console.log(err);
        return next(new errors.InternalServerError('Internal server error'));
    }
});

server.get('/channels', async (req, res, next) => {
    const { team_robot_id } = req.query;

    try {
        const data = await getChannels(team_robot_id);
        res.send(data);
        return next();
    } catch (err) {
        console.log(err);
        return next(new errors.InternalServerError('Internal server error'));
    }
});

server.get('/channel-contacts', async (req, res, next) => {
    const { team_robot_id, channel_id, access_hash, offset } = req.query;

    try {
        const data = await getChannelContacts(team_robot_id, channel_id, access_hash, offset);
        res.send(data);
        return next();
    } catch (err) {
        console.log(err);
        return next(new errors.InternalServerError('Internal server error'));
    }
});

const port = 1337;
server.listen(port, () => {
    console.log('Listening on port %d', port);
});
