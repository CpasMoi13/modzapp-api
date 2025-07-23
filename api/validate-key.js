// API Vercel pour validation des clés ModzApp
// Déploiement : vercel --prod

// Base de données temporaire (en mémoire)
// En production, utiliser une vraie base de données
let validKeys = [
    'MODZ-2024-PREMIUM-8B14A98C',
    'MODZ-2024-PREMIUM-71378840',
    'MODZ-2024-PREMIUM-552DD026',
    'MODZ-2024-PREMIUM-3B4E608E',
    'MODZ-2024-PREMIUM-F87DB226',
    'MODZ-2024-PREMIUM-00892D13',
    'MODZ-2024-PREMIUM-2E5397C3',
    'MODZ-2024-PREMIUM-CAE09556',
    'MODZ-2024-PREMIUM-506DDB5D',
    'MODZ-2024-PREMIUM-0B242D2F',
    'MODZ-2024-PREMIUM-A63AAD30',
    'MODZ-2024-PREMIUM-0857F92A',
    'MODZ-2024-PREMIUM-7D889287',
    'MODZ-2024-PREMIUM-A9E01319',
    'MODZ-2024-PREMIUM-975AC5F1',
    'MODZ-2024-PREMIUM-34645419',
    'MODZ-2024-PREMIUM-213B368F',
    'MODZ-2024-PREMIUM-092385CB',
    'MODZ-2024-PREMIUM-1FFA1781'
];

let revokedKeys = [];
let activatedKeys = new Map();

export default async function handler(req, res) {
    // CORS pour permettre les requêtes depuis l'app
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }
    
    try {
        const { key, machineId, action = 'validate' } = req.body;
        
        if (!key || !machineId) {
            return res.status(400).json({ 
                valid: false, 
                error: 'Clé et ID machine requis' 
            });
        }
        
        // Vérifier si la clé est révoquée
        if (revokedKeys.includes(key)) {
            return res.status(200).json({
                valid: false,
                error: 'Clé révoquée',
                revoked: true
            });
        }
        
        // Vérifier si la clé existe
        if (!validKeys.includes(key)) {
            return res.status(200).json({
                valid: false,
                error: 'Clé invalide'
            });
        }
        
        // Vérifier l'activation
        const keyData = activatedKeys.get(key);
        
        if (action === 'activate') {
            if (keyData && keyData.machineId !== machineId) {
                return res.status(200).json({
                    valid: false,
                    error: 'Clé déjà utilisée sur une autre machine'
                });
            }
            
            // Activer la clé
            activatedKeys.set(key, {
                machineId,
                activatedAt: new Date().toISOString(),
                lastSeen: new Date().toISOString()
            });
            
            return res.status(200).json({
                valid: true,
                message: 'Activation réussie',
                activatedAt: new Date().toISOString()
            });
        }
        
        if (action === 'validate') {
            if (!keyData) {
                return res.status(200).json({
                    valid: false,
                    error: 'Clé non activée'
                });
            }
            
            if (keyData.machineId !== machineId) {
                return res.status(200).json({
                    valid: false,
                    error: 'Machine non autorisée'
                });
            }
            
            // Mettre à jour la dernière connexion
            keyData.lastSeen = new Date().toISOString();
            activatedKeys.set(key, keyData);
            
            return res.status(200).json({
                valid: true,
                message: 'Clé valide',
                lastSeen: keyData.lastSeen
            });
        }
        
        return res.status(400).json({
            valid: false,
            error: 'Action non reconnue'
        });
        
    } catch (error) {
        console.error('Erreur validation:', error);
        return res.status(500).json({
            valid: false,
            error: 'Erreur serveur'
        });
    }
}
