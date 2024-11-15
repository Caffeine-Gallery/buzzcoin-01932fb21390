import { backend } from 'declarations/backend';
import { AuthClient } from '@dfinity/auth-client';
import { Principal } from '@dfinity/principal';

let authClient;
let userPrincipal;

async function init() {
    authClient = await AuthClient.create();
    const isAuthenticated = await authClient.isAuthenticated();
    
    updateUI(isAuthenticated);
    
    if (isAuthenticated) {
        userPrincipal = await authClient.getIdentity().getPrincipal();
        document.getElementById('connectWallet').textContent = 'Connected';
        await updateBalance();
        await loadTransactions();
    }

    // Display canister ID
    const canisterId = process.env.CANISTER_ID_BACKEND || '';
    document.getElementById('canisterId').textContent = canisterId;
}

async function connect() {
    try {
        await authClient.login({
            identityProvider: 'https://identity.ic0.app/#authorize',
            onSuccess: async () => {
                userPrincipal = await authClient.getIdentity().getPrincipal();
                updateUI(true);
                document.getElementById('connectWallet').textContent = 'Connected';
                await updateBalance();
                await loadTransactions();
            },
        });
    } catch (e) {
        console.error('Connection failed:', e);
    }
}

async function mine() {
    if (!userPrincipal) return;

    const button = document.getElementById('mineButton');
    const spinner = button.querySelector('.spinner-border');
    
    button.disabled = true;
    spinner.classList.remove('d-none');

    try {
        const result = await backend.mine();
        if (result.ok) {
            alert('Mining successful!');
            await updateBalance();
            await loadTransactions();
        } else {
            alert('Mining failed: ' + result.err);
        }
    } catch (e) {
        console.error('Mining error:', e);
        alert('Mining failed. Please try again.');
    } finally {
        button.disabled = false;
        spinner.classList.add('d-none');
    }
}

async function updateBalance() {
    if (!userPrincipal) return;
    
    try {
        const balance = await backend.balanceOf(userPrincipal);
        document.getElementById('balance').textContent = `${balance} CAFF`;
    } catch (e) {
        console.error('Balance update failed:', e);
        document.getElementById('balance').textContent = 'Error loading balance';
    }
}

async function loadTransactions() {
    try {
        const transactions = await backend.getTransactions(0, 10);
        const tbody = document.getElementById('transactionsList');
        tbody.innerHTML = '';

        transactions.forEach(tx => {
            const row = document.createElement('tr');
            row.innerHTML = `
                <td>${tx.txType}</td>
                <td>${tx.amount} CAFF</td>
                <td>${tx.from.toText().slice(0, 10)}...</td>
                <td>${tx.to.toText().slice(0, 10)}...</td>
                <td>${new Date(Number(tx.timestamp) / 1000000).toLocaleString()}</td>
            `;
            tbody.appendChild(row);
        });
    } catch (e) {
        console.error('Failed to load transactions:', e);
    }
}

function updateUI(isAuthenticated) {
    const mineButton = document.getElementById('mineButton');
    mineButton.disabled = !isAuthenticated;
}

// Event Listeners
document.getElementById('connectWallet').addEventListener('click', connect);
document.getElementById('mineButton').addEventListener('click', mine);

// Initialize the app
init().catch(console.error);
