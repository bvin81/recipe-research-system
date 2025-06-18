// Recipe Research System - Main Application (Valós Adatokkal)
class RecipeResearchSystem {
    constructor() {
        this.recipes = [];
        this.translations = {};
        this.currentUser = null;
        this.testGroup = null;
        this.searchStartTime = null;
        
        this.initializeApp();
    }
    
    async initializeApp() {
        // Adatok betöltése
        await this.loadData();
        
        // Event listenrek
        this.setupEventListeners();
        
        // Felhasználó ellenőrzése
        this.checkExistingUser();
    }
    
    async loadData() {
        try {
            console.log('🔄 Valós receptadatok betöltése...');
            
            // Receptek betöltése
            const recipesResponse = await fetch('./data/recipes_sample.json');
            if (!recipesResponse.ok) {
                throw new Error(`HTTP error! status: ${recipesResponse.status}`);
            }
            this.recipes = await recipesResponse.json();
            
            // Fordítások betöltése
            const translationsResponse = await fetch('./data/translations.json');
            if (!translationsResponse.ok) {
                throw new Error(`HTTP error! status: ${translationsResponse.status}`);
            }
            this.translations = await translationsResponse.json();
            
            console.log(`✅ Betöltve ${this.recipes.length} valós recept`);
            console.log(`✅ Betöltve ${Object.keys(this.translations).length} fordítás`);
            
        } catch (error) {
            console.error('❌ Adatok betöltési hiba:', error);
            console.log('⚠️ Fallback teszt adatokra...');
            
            // Fallback teszt adatok
            this.recipes = [
                {
                    recipeid: 1,
                    name: "Áfonyás Joghurt",
                    ingredients: "áfonya, cukor, joghurt, citromlé",
                    env_score: 12.1,
                    nutri_score: 18.9,
                    sustainability_index: 65.2,
                    recommendation_type: 'ingredient_based'
                },
                {
                    recipeid: 2,
                    name: "Zöldséges Leves",
                    ingredients: "paradicsomlé, káposzta, hagyma, sárgarépa",
                    env_score: 19.3,
                    nutri_score: 51.3,
                    sustainability_index: 72.1,
                    recommendation_type: 'sustainability_optimized'
                }
            ];
            
            this.translations = {
                'salt': 'só',
                'sugar': 'cukor',
                'chicken': 'csirke',
                'tomato': 'paradicsom'
            };
        }
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
        
        this.searchStartTime = Date.now();
        
        // Valós ajánló algoritmus (50-50% stratégia)
        const results = this.getRecommendations(ingredients, this.testGroup);
        this.displayResults(results, ingredients);
    }
    
    // 50-50% AJÁNLÓ STRATÉGIA (a Python kódból átvéve)
    getRecommendations(searchIngredients, testGroup, numRecommendations = 10) {
        const ingredientList = searchIngredients.toLowerCase().split(',').map(s => s.trim());
        
        // 1. Összetevő alapú szűrés
        const ingredientBased = this.filterByIngredients(ingredientList);
        
        // 2. Fenntarthatóság alapú rendezés
        const sustainabilityOptimized = this.sortBySustainability([...ingredientBased]);
        
        // 3. Csoport specifikus logika
        switch(testGroup) {
            case 'A': // Control - csak ingredient based, random sorrendben
                return this.shuffleArray([...ingredientBased]).slice(0, numRecommendations);
                
            case 'B': // Health + Environment
            case 'C': // B + XAI
                return this.createBalancedMix(
                    ingredientBased, 
                    sustainabilityOptimized, 
                    numRecommendations
                );
                
            default:
                return ingredientBased.slice(0, numRecommendations);
        }
    }
    
    filterByIngredients(ingredientList) {
        return this.recipes.filter(recipe => {
            const recipeIngredients = recipe.ingredients.toLowerCase();
            return ingredientList.some(ingredient => 
                recipeIngredients.includes(ingredient)
            );
        });
    }
    
    sortBySustainability(recipes) {
        return recipes.sort((a, b) => {
            // Magasabb sustainability_index = jobb
            return (b.sustainability_index || 0) - (a.sustainability_index || 0);
        });
    }
    
    // 50-50% STRATÉGIA implementáció
    createBalancedMix(ingredientBased, sustainabilityOptimized, numRecommendations) {
        const halfSize = Math.floor(numRecommendations / 2);
        
        // Fele ingredient-based, fele sustainability-optimized
        const ingredientPart = ingredientBased.slice(0, halfSize);
        const sustainabilityPart = sustainabilityOptimized
            .filter(recipe => !ingredientPart.some(r => r.recipeid === recipe.recipeid))
            .slice(0, numRecommendations - halfSize);
        
        // Keverés és típus megjelölése
        const mixed = [
            ...ingredientPart.map(r => ({...r, recommendation_type: 'ingredient_based'})),
            ...sustainabilityPart.map(r => ({...r, recommendation_type: 'sustainability_optimized'}))
        ];
        
        return this.shuffleArray(mixed);
    }
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    displayResults(recipes, searchIngredients) {
        const resultsDiv = document.getElementById('search-results');
        
        if (recipes.length === 0) {
            resultsDiv.innerHTML = '<p>Nem találtunk receptet ezekkel a hozzávalókkal. Próbálja meg: csirke, paradicsom, tej, tojás, liszt, hagyma</p>';
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
        
        // Magyar fordítás alkalmazása
        const translatedIngredients = this.translateIngredients(recipe.ingredients);
        
        return `
            <div class="recipe-card">
                <div class="recipe-name">${recipe.name}</div>
                <div class="recipe-ingredients">
                    <strong>Hozzávalók:</strong> ${translatedIngredients}
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
                        onclick="app.selectRecipe(${recipe.recipeid}, '${recipe.name?.replace(/'/g, "\\'")}', ${index + 1}, '${searchIngredients}')">
                    ✅ Ezt választom
                </button>
            </div>
        `;
    }
    
    // Magyar fordítás alkalmazása
    translateIngredients(ingredients) {
        if (!ingredients || !this.translations) return ingredients;
        
        let translated = ingredients;
        
        // Minden fordítást alkalmazunk
        Object.entries(this.translations).forEach(([english, hungarian]) => {
            // Teljes szavak cseréje (word boundary)
            const regex = new RegExp(`\\b${english}\\b`, 'gi');
            translated = translated.replace(regex, hungarian);
        });
        
        return translated;
    }
    
    // XAI MAGYARÁZATOK (a meglévő Python logika alapján)
    generateXAIExplanation(recipe) {
        if (!recipe) return "Nincs elérhető magyarázat.";
        
        const sustainability = recipe.sustainability_index || 0;
        const envScore = recipe.env_score || 0;
        const nutriScore = recipe.nutri_score || 0;
        const recType = recipe.recommendation_type || 'unknown';
        
        let explanation = "";
        
        // Ajánlás típusa alapján
        if (recType === 'sustainability_optimized') {
            explanation += "🌱 Fenntarthatóság alapján ajánlott: ";
        } else if (recType === 'ingredient_based') {
            explanation += "🎯 Összetevők alapján ajánlott: ";
        }
        
        // Pontszámok alapján
        if (sustainability >= 75) {
            explanation += "Kiváló fenntarthatósági és egészségügyi értékek.";
        } else if (sustainability >= 50) {
            explanation += "Jó egyensúly a fenntarthatóság és egészség között.";
        } else if (sustainability >= 25) {
            explanation += "Közepes fenntarthatósági érték.";
        } else {
            explanation += "Alapvető recept, fejleszthető fenntarthatósági szempontból.";
        }
        
        // Specifikus indokok
        if (envScore < 30) {
            explanation += " Alacsony környezeti hatás.";
        }
        if (nutriScore > 50) {
            explanation += " Magas tápértékű.";
        }
        
        return explanation;
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
        
        console.log('Választott recept:', choiceData);
        
        // Helyi tárolás
        this.saveChoiceLocally(choiceData);
        
        // Itt később Google Forms submission lesz
        alert(`Köszönjük! Választott recept: ${recipeName}`);
        
        this.showSection('thank-you-section');
    }
    
    saveChoiceLocally(choiceData) {
        const choices = JSON.parse(localStorage.getItem('userChoices') || '[]');
        choices.push(choiceData);
        localStorage.setItem('userChoices', JSON.stringify(choices));
        console.log('Választás mentve helyileg:', choiceData);
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
