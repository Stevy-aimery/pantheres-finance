
// Script de test de connexion Supabase direct (sans dépendances externes sauf supabase-js)
const fs = require('fs');
const path = require('path');
const { createClient } = require('@supabase/supabase-js');

// Lire .env.local manuellement
const envPath = path.resolve(__dirname, '.env.local');
const envContent = fs.readFileSync(envPath, 'utf8');

const env = {};
envContent.split('\n').forEach(line => {
    const match = line.match(/^([^=]+)=(.*)$/);
    if (match) {
        env[match[1].trim()] = match[2].trim().replace(/^["']|["']$/g, '');
    }
});

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
    console.error('❌ ERREUR: Variables d\'environnement manquantes !');
    process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
    const email = 'joueur1@pantheres.com';
    const password = 'joueur@pantheres';

    console.log(`⏳ Tentative de connexion pour ${email}...`);

    const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
    });

    if (error) {
        console.error('❌ ÉCHEC DE LA CONNEXION :');
        console.error(error.message);
        if (error.message === 'Invalid login credentials') {
            console.log('\n💡 DIAGNOSTIC : Mot de passe incorrect ou email non confirmé.');
        }
    } else {
        console.log('✅ SUCCÈS ! Connexion réussie.');
        console.log('User ID:', data.user.id);
        console.log('Email:', data.user.email);
        console.log('Role:', data.user.user_metadata.role);
    }
}

testLogin();
