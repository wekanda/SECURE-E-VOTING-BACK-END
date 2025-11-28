const { query } = require('../config/database');

const auditLog = async (actorType, actorId, action, entity, entityId, payload = {}) => {
  try {
    await query(
      'INSERT INTO audit_log (actor_type, actor_id, action, entity, entity_id, payload) VALUES (?, ?, ?, ?, ?, ?)',
      [actorType, actorId, action, entity, entityId, JSON.stringify(payload)]
    );
  } catch (error) {
    console.error('Audit log error:', error);
  }
};

const auditMiddleware = (action, entity) => {
  return async (req, res, next) => {
    const originalSend = res.send;
    
    res.send = function(data) {
      if (res.statusCode >= 200 && res.statusCode < 300) {
        const actorType = req.user ? req.user.role : 'system';
        const actorId = req.user ? req.user.id : null;
        const entityId = req.params.id || (typeof data === 'object' && data.id) || null;
        
        auditLog(actorType, actorId, action, entity, entityId, {
          method: req.method,
          url: req.originalUrl,
          body: req.body
        });
      }
      
      originalSend.call(this, data);
    };
    
    next();
  };
};

module.exports = { auditLog, auditMiddleware };