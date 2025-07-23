// API Admin pour gérer les clés ModzApp
// URL: https://ton-app.vercel.app/api/admin

const ADMIN_PASSWORD = 'admin123'; // En production, utiliser des variables d'environnement

// Base de données temporaire partagée (en mémoire)
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
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'POST, GET, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
    
    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }
    
    // Vérification du mot de passe admin
    const auth = req.headers.authorization;
    if (!auth || auth !== `Bearer ${ADMIN_PASSWORD}`) {
        return res.status(401).json({ error: 'Non autorisé' });
    }
    
    try {
        if (req.method === 'GET') {
            // Statistiques
            return res.status(200).json({
                totalKeys: validKeys.length,
                activatedKeys: activatedKeys.size,
                revokedKeys: revokedKeys.length,
                activeUsers: Array.from(activatedKeys.entries()).map(([key, data]) => ({
                    key: key.substring(0, 8) + '...',
                    activatedAt: data.activatedAt,
                    lastSeen: data.lastSeen,
                    machineId: data.machineId.substring(0, 8) + '...'
                }))
            });
        }
        
        if (req.method === 'POST') {
            const { action, key } = req.body;
            
            switch (action) {
                case 'revoke':
                    if (!validKeys.includes(key)) {
                        return res.status(400).json({ error: 'Clé non trouvée' });
                    }
                    
                    if (!revokedKeys.includes(key)) {
                        revokedKeys.push(key);
                    }
                    
                    // Supprimer de la liste des activées
                    activatedKeys.delete(key);
                    
                    return res.status(200).json({
                        success: true,
                        message: `Clé ${key} révoquée avec succès`
                    });
                
                case 'unrestrict':
                    const index = revokedKeys.indexOf(key);
                    if (index > -1) {
                        revokedKeys.splice(index, 1);
                    }
                    
                    return res.status(200).json({
                        success: true,
                        message: `Clé ${key} réactivée avec succès`
                    });
                
                case 'generate':
                    const newKey = `MODZ-2024-PREMIUM-${Math.random().toString(16).substr(2, 8).toUpperCase()}`;
                    validKeys.push(newKey);
                    
                    return res.status(200).json({
                        success: true,
                        key: newKey,
                        message: 'Nouvelle clé générée'
                    });
                
                default:
                    return res.status(400).json({ error: 'Action non reconnue' });
            }
        }
        
    } catch (error) {
        console.error('Erreur admin:', error);
        return res.status(500).json({ error: 'Erreur serveur' });
    }
}
