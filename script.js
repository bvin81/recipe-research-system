// Recipe Research System - Main Application
class RecipeResearchSystem {
    constructor() {
        this.recipes = [];
        this.translations = {};
        this.currentUser = null;
        this.testGroup = null;
        
        // Teszt adatok (később a JSON fájlokból jönnek)
        this.recipes = [
            {
                recipeid: 1,
                name: "Áfonyás Joghurt",
                ingredients: "áfonya, cukor, joghurt, citromlé",
                env_score: 12.1,
                nutri_score: 18.9,
                sustainability_index: 65.2
            },
            {
                recipeid: 2,
                name: "Zöldséges Leves",
                ingredients: "paradicsomlé, káposzta, hagyma, sárgarépa",
                env_score: 19.3,
                nutri_score: 51.3,
                sustainability_index: 72.1
            }
        ];
        
        this.initializeApp();
    }
    
    initializeApp() {
        this.setupEventListeners();
        this.checkExistingUser();
    }
    
    setupEventListeners() {
        // Regisztráció
        document.getElementById('registration-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });
        
        // Keresés
        document.getElementById('search-btn').addEventListener('click', () => {
            this.handleSearch();
        });
        
        // Enter a kereséshez
        document.getElementById('ingredient-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
        // Új keresés
        document.getElementById('new-search-btn').addEventListener('click', () => {
            this.showSection('search-section');
            document.getElementById('ingredient-search').value = '';
            document.getElementById('search-results').innerHTML = '';
        });
    }
    
    checkExistingUser() {
        const savedUser = localStorage.getItem('recipeUser');
        if (savedUser) {
            this.currentUser = JSON.parse(savedUser);
            this.testGroup = this.currentUser.testGroup;
            this.showSection('search-section');
            this.updateUserDisplay();
        } else {
            this.showSection('registration-section');
        }
    }
    
    handleRegistration() {
        const email = document.getElementById('email').value;
        
        // User ID generálás
        const userId = Date.now() + Math.random().toString(36).substr(2, 9);
        
        // Teszt csoport hozzárendelés (A/B/C)
        const testGroup = this.assignTestGroup(userId);
        
        // Felhasználó objektum
        const user = {
            id: userId,
            email: email,
            testGroup: testGroup,
            registeredAt: new Date().toISOString()
        };
        
        // Helyi tárolás
        this.currentUser = user;
        this.testGroup = testGroup;
        localStorage.setItem('recipeUser', JSON.stringify(user));
        
        console.log('Regisztrált felhasználó:', user);
        
        // UI átváltás
        this.showSection('search-section');
        this.updateUserDisplay();
    }
    
    assignTestGroup(userId) {
        // Hash alapú konzisztens hozzárendelés (A/B/C)
        const hash = this.simpleHash(userId.toString());
        const groups = ['A', 'B', 'C'];
        return groups[hash % 3];
    }
    
    simpleHash(str) {
        let hash = 0;
        for (let i = 0; i < str.length; i++) {
            const char = str.charCodeAt(i);
            hash = ((hash << 5) - hash) + char;
            hash = hash & hash;
        }
        return Math.abs(hash);
    }
    
    updateUserDisplay() {
        const groupDescriptions = {
            'A': 'Kontroll csoport',
            'B': 'Fenntarthatósági pontszámokkal', 
            'C': 'Fenntarthatóság + AI magyarázatok'
        };
        
        document.getElementById('user-group').textContent = 
            `${this.testGroup} (${groupDescriptions[this.testGroup]})`;
    }
    
    handleSearch() {
        const ingredients = document.getElementById('ingredient-search').value;
        if (!ingredients.trim()) {
            alert('Kérjük, adjon meg legalább egy hozzávalót!');
            return;
        }
        
        // Egyszerű keresés a teszt adatokban
        const results = this.getRecommendations(ingredients);
        this.displayResults(results, ingredients);
    }
    
    getRecommendations(searchIngredients) {
        const ingredientList = searchIngredients.toLowerCase().split(',').map(s => s.trim());
        
        // Egyszerű matching
        const matched = this.recipes.filter(recipe => {
            const recipeIngredients = recipe.ingredients.toLowerCase();
            return ingredientList.some(ingredient => 
                recipeIngredients.includes(ingredient)
            );
        });
        
        return matched.length > 0 ? matched : this.recipes; // Ha nincs találat, mutasd mind
    }
    
    displayResults(recipes, searchIngredients) {
        const resultsDiv = document.getElementById('search-results');
        
        if (recipes.length === 0) {
            resultsDiv.innerHTML = '<p>Nem találtunk receptet ezekkel a hozzávalókkal.</p>';
            return;
        }
        
        let html = '<h3>📋 Ajánlott receptek:</h3>';
        
        recipes.forEach((recipe, index) => {
            html += this.generateRecipeCard(recipe, index, searchIngredients);
        });
        
        resultsDiv.innerHTML = html;
    }
    
    generateRecipeCard(recipe, index, searchIngredients) {
        const showScores = ['B', 'C'].includes(this.testGroup);
        const showXAI = this.testGroup === 'C';
        
        return `
            <div class="recipe-card">
                <div class="recipe-name">${recipe.name}</div>
                <div class="recipe-ingredients">
                    <strong>Hozzávalók:</strong> ${recipe.ingredients}
                </div>
                
                ${showScores ? `
                    <div class="sustainability-scores">
                        <div class="score env-score">
                            🌍 Környezeti pontszám: ${recipe.env_score?.toFixed(1) || 'N/A'}
                        </div>
                        <div class="score nutri-score">
                            💚 Táplálkozási pontszám: ${recipe.nutri_score?.toFixed(1) || 'N/A'}
                        </div>
                        <div class="score">
                            ⭐ Fenntarthatóság: ${recipe.sustainability_index?.toFixed(1) || 'N/A'}/100
                        </div>
                    </div>
                ` : ''}
                
                ${showXAI ? `
                    <div class="xai-explanation">
                        <strong>🧠 Miért ajánljuk:</strong>
                        <p>${this.generateXAIExplanation(recipe)}</p>
                    </div>
                ` : ''}
                
                <button class="select-recipe-btn" 
                        onclick="app.selectRecipe(${recipe.recipeid}, '${recipe.name}', ${index + 1})">
                    ✅ Ezt választom
                </button>
            </div>
        `;
    }
    
    generateXAIExplanation(recipe) {
        const sustainability = recipe.sustainability_index || 0;
        
        if (sustainability >= 70) {
            return "Ez egy kiváló fenntartható választás magas tápértékkel és alacsony környezeti hatással.";
        } else if (sustainability >= 50) {
            return "Jó egyensúly a fenntarthatóság és az egészség között.";
        } else {
            return "Alapvető recept, amely még fejleszthető fenntarthatósági szempontból.";
        }
    }
    
    selectRecipe(recipeId, recipeName, rank) {
        console.log('Választott recept:', {
            userId: this.currentUser.id,
            testGroup: this.testGroup,
            recipeId: recipeId,
            recipeName: recipeName,
            rank: rank
        });
        
        // Itt később Google Forms submission lesz
        alert(`Köszönjük! Választott recept: ${recipeName}`);
        
        this.showSection('thank-you-section');
    }
    
    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(sectionId).classList.remove('hidden');
    }
}

// Alkalmazás indítása
let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new RecipeResearchSystem();
});
