const restify = require('restify');
const errors = require('restify-errors');
const logger = require('morgan');

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
const getChannelContacts = async (q, args = {}) => {
  let tsRank = '';
  let tsQuery = '';
  let whereCond = '';
  let orderBy = 'ORDER BY artigos.created_at DESC';


  console.log(sqlQuery);
  console.dir({
    q,
    orderBy,
    whereCond,
    limit,
    offset,
    tsRank,
  });

  // Retrieve results
  const results = await db.any(sqlQuery, {
    q,
    orderBy,
    whereCond,
    limit,
    offset,
    tsRank,
  });

  // Pagination flag
  const hasMore = Boolean(results[limit]);

  return {
  };
};

/**
  * Routes
  */
server.post('/channel-contacts', async (req, res, next) => {
  const { _q, _limit, _offset } = req.query;

  try {
    const data = await getChannelContacts(_q, { limit: _limit, offset: _offset });
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
