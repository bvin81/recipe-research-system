// Recipe Research System - CLEAN VERSION
class RecipeResearchSystem {
    constructor() {
        this.recipes = [];
        this.currentUser = null;
        this.testGroup = null;
        this.searchStartTime = null;
        
        this.initializeApp();
    }
    
    async initializeApp() {
        console.log('App starting...');
        this.loadFallbackData();
        this.setupEventListeners();
        this.checkExistingUser();
        console.log('App ready!');
    }
    
    loadFallbackData() {
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
            },
            {
                recipeid: 3,
                name: "Csirke Recept",
                ingredients: "csirke, hagyma, paradicsom, só, bors",
                env_score: 25.4,
                nutri_score: 45.8,
                sustainability_index: 68.5
            }
        ];
        console.log('Test data loaded:', this.recipes.length, 'recipes');
    }
    
    setupEventListeners() {
        document.getElementById('registration-form').addEventListener('submit', (e) => {
            e.preventDefault();
            this.handleRegistration();
        });
        
        document.getElementById('search-btn').addEventListener('click', () => {
            this.handleSearch();
        });
        
        document.getElementById('ingredient-search').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') {
                this.handleSearch();
            }
        });
        
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
        
        if (!email) {
            alert('Kérjük, adjon meg email címet!');
            return;
        }
        
        const userId = Date.now() + Math.random().toString(36).substr(2, 9);
        const testGroup = this.assignTestGroup(userId);
        
        const user = {
            id: userId,
            email: email,
            testGroup: testGroup,
            registeredAt: new Date().toISOString()
        };
        
        this.currentUser = user;
        this.testGroup = testGroup;
        localStorage.setItem('recipeUser', JSON.stringify(user));
        
        console.log('User registered:', user);
        
        this.showSection('search-section');
        this.updateUserDisplay();
    }
    
    assignTestGroup(userId) {
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
            this.testGroup + ' (' + groupDescriptions[this.testGroup] + ')';
    }
    
    handleSearch() {
        const ingredients = document.getElementById('ingredient-search').value;
        if (!ingredients.trim()) {
            alert('Kérjük, adjon meg legalább egy hozzávalót!');
            return;
        }
        
        console.log('Searching for:', ingredients);
        
        this.searchStartTime = Date.now();
        const results = this.getRecommendations(ingredients);
        this.displayResults(results, ingredients);
    }
    
    getRecommendations(searchIngredients) {
        const ingredientList = searchIngredients.toLowerCase().split(',').map(s => s.trim());
        
        let matched = this.recipes.filter(recipe => {
            const recipeIngredients = recipe.ingredients.toLowerCase();
            return ingredientList.some(ingredient => 
                recipeIngredients.includes(ingredient)
            );
        });
        
        if (matched.length === 0) {
            matched = this.recipes.slice(0, 2);
        }
        
        return matched;
    }
    
    displayResults(recipes, searchIngredients) {
        const resultsDiv = document.getElementById('search-results');
        
        if (recipes.length === 0) {
            resultsDiv.innerHTML = '<p>Nem találtunk receptet. Próbálja: csirke, hagyma, paradicsom</p>';
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
                            🌍 Környezeti pontszám: ${recipe.env_score.toFixed(1)}
                        </div>
                        <div class="score nutri-score">
                            💚 Táplálkozási pontszám: ${recipe.nutri_score.toFixed(1)}
                        </div>
                        <div class="score">
                            ⭐ Fenntarthatóság: ${recipe.sustainability_index.toFixed(1)}/100
                        </div>
                    </div>
                ` : ''}
                
                ${showXAI ? `
                    <div class="xai-explanation">
                        <strong>🧠 Miért ajánljuk:</strong>
                        <p>Ez egy ${recipe.sustainability_index >= 70 ? 'kiváló' : 'jó'} fenntartható választás.</p>
                    </div>
                ` : ''}
                
                <button class="select-recipe-btn" 
                        onclick="app.selectRecipe(${recipe.recipeid}, '${recipe.name}', ${index + 1}, '${searchIngredients}')">
                    ✅ Ezt választom
                </button>
            </div>
        `;
    }
    
    selectRecipe(recipeId, recipeName, rank, searchIngredients) {
        const decisionTime = (Date.now() - this.searchStartTime) / 1000;
        
        const choiceData = {
            userId: this.currentUser.id,
            testGroup: this.testGroup,
            recipeId: recipeId,
            recipeName: recipeName,
            rank: rank,
            searchIngredients: searchIngredients,
            decisionTime: decisionTime,
            timestamp: new Date().toISOString()
        };
        
        console.log('Recipe selected:', choiceData);
        
        const choices = JSON.parse(localStorage.getItem('userChoices') || '[]');
        choices.push(choiceData);
        localStorage.setItem('userChoices', JSON.stringify(choices));
        
        alert('Köszönjük! Választott recept: ' + recipeName);
        
        this.showSection('thank-you-section');
    }
    
    showSection(sectionId) {
        document.querySelectorAll('.section').forEach(section => {
            section.classList.add('hidden');
        });
        document.getElementById(sectionId).classList.remove('hidden');
    }
}

let app;
document.addEventListener('DOMContentLoaded', () => {
    app = new RecipeResearchSystem();
});
