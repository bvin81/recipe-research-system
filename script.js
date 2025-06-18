// Recipe Research System - MŰKÖDŐ VERZIÓ
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
        console.log('🔄 Alkalmazás inicializálása...');
        
        // Adatok betöltése
        await this.loadData();
        
        // Event listenrek
        this.setupEventListeners();
        
        // Felhasználó ellenőrzése
        this.checkExistingUser();
        
        console.log('✅ Alkalmazás inicializálva');
    }
    
    async loadData() {
        try {
            console.log('🔄 Adatok betöltése...');
            
            // Próbáljuk betölteni a recepteket
            try {
                const recipesResponse = await fetch('./data/recipes_sample.json');
                if (recipesResponse.ok) {
                    this.recipes = await recipesResponse.json();
                    console.log(`✅ Betöltve ${this.recipes.length} recept`);
                } else {
                    throw new Error('Receptek betöltése sikertelen');
                }
            } catch (error) {
                console.log('⚠️ Receptek betöltése sikertelen, teszt adatok használata');
                this.loadFallbackData();
            }
            
            // Próbáljuk betölteni a fordításokat
            try {
                const translationsResponse = await fetch('./data/translations.json');
                if (translationsResponse.ok) {
                    this.translations = await translationsResponse.json();
                    console.log(`✅ Betöltve ${Object.keys(this.translations).length} fordítás`);
                } else {
                    throw new Error('Fordítások betöltése sikertelen');
                }
            } catch (error) {
                console.log('⚠️ Fordítások betöltése sikertelen, alapértelmezett fordítások');
                this.loadBasicTranslations();
            }
            
        } catch (error) {
            console.error('❌ Adatok betöltési hiba:', error);
            this.loadFallbackData();
            this.loadBasicTranslations();
        }
    }
    
    loadFallbackData() {
        console.log('📋 Teszt adatok betöltése...');
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
            },
            {
                recipeid: 3,
                name: "Csirke Recept",
                ingredients: "csirke, hagyma, paradicsom, só, bors",
                env_score: 25.4,
                nutri_score: 45.8,
                sustainability_index: 68.5,
                recommendation_type: 'ingredient_based'
            },
            {
                recipeid: 4,
                name: "Tejszínes Tészta",
                ingredients: "tészta, tejszín, sajt, fokhagyma, petrezselyem",
                env_score: 30.2,
                nutri_score: 38.9,
                sustainability_index: 55.3,
                recommendation_type: 'sustainability_optimized'
            }
        ];
        console.log(`✅ ${this.recipes.length} teszt recept betöltve`);
    }
    
    loadBasicTranslations() {
        this.translations = {
            'chicken': 'csirke',
            'onion': 'hagyma',
            'tomato': 'paradicsom',
            'milk': 'tej',
            'egg': 'tojás',
            'salt': 'só',
            'sugar': 'cukor',
            'garlic': 'fokhagyma',
            'pepper': 'bors',
            'cheese': 'sajt'
        };
        console.log(`✅ ${Object.keys(this.translations).length} alapfordítás betöltve`);
    }
    
    setupEventListeners() {
        try {
            // Regisztráció
            const regForm = document.getElementById('registration-form');
            if (regForm) {
                regForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRegistration();
                });
            }
            
            // Keresés
            const searchBtn = document.getElementById('search-btn');
            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    this.handleSearch();
                });
            }
            
            // Enter a kereséshez
            const searchInput = document.getElementById('ingredient-search');
            if (searchInput) {
                searchInput.addEventListener('keypress', (e) => {
                    if (e.key === 'Enter') {
                        this.handleSearch();
                    }
                });
            }
            
            // Új keresés
            const newSearchBtn = document.getElementById('new-search-btn');
            if (newSearchBtn) {
                newSearchBtn.addEventListener('click', () => {
                    this.showSection('search-section');
                    const searchInput = document.getElementById('ingredient-search');
                    if (searchInput) searchInput.value = '';
                    const resultsDiv = document.getElementById('search-results');
                    if (resultsDiv) resultsDiv.innerHTML = '';
                });
            }
            
            console.log('✅ Event listeners beállítva');
        } catch (error) {
            console.error('❌ Event listeners hiba:', error);
        }
    }
    
    checkExistingUser() {
        try {
            const savedUser = localStorage.getItem('recipeUser');
            if (savedUser) {
                this.currentUser = JSON.parse(savedUser);
                this.testGroup = this.currentUser.testGroup;
                this.showSection('search-section');
                this.updateUserDisplay();
                console.log('✅ Meglévő felhasználó betöltve:', this.testGroup + ' csoport');
            } else {
                this.showSection('registration-section');
                console.log('📝 Új felhasználó - regisztráció szükséges');
            }
        } catch (error) {
            console.error('❌ Felhasználó ellenőrzési hiba:', error);
            this.showSection('registration-section');
        }
    }
    
    handleRegistration() {
        try {
            console.log('📝 Regisztráció kezdése...');
            
            const emailInput = document.getElementById('email');
            if (!emailInput) {
                throw new Error('Email mező nem található');
            }
            
            const email = emailInput.value;
            if (!email) {
                alert('Kérjük, adjon meg email címet!');
                return;
            }
            
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
            
            console.log('✅ Regisztráció sikeres:', user);
            
            // UI átváltás
            this.showSection('search-section');
            this.updateUserDisplay();
            
        } catch (error) {
            console.error('❌ Regisztrációs hiba:', error);
            alert('Regisztrációs hiba történt. Próbálja újra!');
        }
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
        try {
            const groupDescriptions = {
                'A': 'Kontroll csoport',
                'B': 'Fenntarthatósági pontszámokkal', 
                'C': 'Fenntarthatóság + AI magyarázatok'
            };
            
            const userGroupElement = document.getElementById('user-group');
            if (userGroupElement) {
                userGroupElement.textContent = 
                    `${this.testGroup} (${groupDescriptions[this.testGroup]})`;
            }
            
            console.log(`✅ Felhasználói csoport megjelenítve: ${this.testGroup}`);
        } catch (error) {
            console.error('❌ Felhasználói megjelenítés hiba:', error);
        }
    }
    
    handleSearch() {
        try {
            console.log('🔍 Keresés kezdése...');
            
            const searchInput = document.getElementById('ingredient-search');
            if (!searchInput) {
                throw new Error('Keresési mező nem található');
            }
            
            const ingredients = searchInput.value;
            if (!ingredients.trim()) {
                alert('Kérjük, adjon meg legalább egy hozzávalót!');
                return;
            }
            
            console.log(`🔍 Keresési kifejezés: "${ingredients}"`);
            
            this.searchStartTime = Date.now();
            
            // Keresés végrehajtása
            const results = this.getRecommendations(ingredients, this.testGroup);
            console.log(`📋 Találatok: ${results.length} recept`);
            
            this.displayResults(results, ingredients);
            
        } catch (error) {
            console.error('❌ Keresési hiba:', error);
            alert('Keresési hiba történt. Próbálja újra!');
        }
    }
    
    getRecommendations(searchIngredients, testGroup, numRecommendations = 10) {
        const ingredientList = searchIngredients.toLowerCase().split(',').map(s => s.trim());
        
        // Alapszűrés
        let matched = this.filterByIngredients(ingredientList);
        
        if (matched.length === 0) {
            // Ha nincs találat, adjunk vissza néhány receptet
            matched = this.recipes.slice(0, Math.min(4, this.recipes.length));
            console.log('⚠️ Nincs közvetlen találat, alternatív receptek megjelenítése');
        }
        
        // Csoport specifikus logika
        switch(testGroup) {
            case 'A': // Control - egyszerű lista
                return this.shuffleArray([...matched]).slice(0, numRecommendations);
                
            case 'B': // Health + Environment
            case 'C': // B + XAI
                // Fenntarthatóság szerint rendezés
                const sorted = matched.sort((a, b) => 
                    (b.sustainability_index || 0) - (a.sustainability_index || 0)
                );
                return sorted.slice(0, numRecommendations);
                
            default:
                return matched.slice(0, numRecommendations);
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
    
    shuffleArray(array) {
        const shuffled = [...array];
        for (let i = shuffled.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffled[i], shuffled[j]] = [shuffled[j], shuffled[i]];
        }
        return shuffled;
    }
    
    displayResults(recipes, searchIngredients) {
        try {
            const resultsDiv = document.getElementById('search-results');
            if (!resultsDiv) {
                throw new Error('Eredmények div nem található');
            }
            
            if (recipes.length === 0) {
                resultsDiv.innerHTML = '<p>Nem találtunk receptet. Próbálja: csirke, hagyma, paradicsom, tej</p>';
                return;
            }
            
            let html = '<h3>📋 Ajánlott receptek:</h3>';
            
            recipes.forEach((recipe, index) => {
                html += this.generateRecipeCard(recipe, index, searchIngredients);
            });
            
            resultsDiv.innerHTML = html;
            console.log(`✅ ${recipes.length} recept megjelenítve`);
            
        } catch (error) {
            console.error('❌ Eredmények megjelenítési hiba:', error);
        }
    }
    
    generateRecipeCard(recipe, index, searchIngredients) {
        const showScores = ['B', 'C'].includes(this.testGroup);
        const showXAI = this.testGroup === 'C';
        
        return `
            <div class="recipe-card">
                <div class="recipe-name">${recipe.name || `Recept #${recipe.recipeid}`}</div>
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
                        onclick="app.selectRecipe(${recipe.recipeid}, '${(recipe.name || 'Recept').replace(/'/g, "\\'")}', ${index + 1}, '${searchIngredients.replace(/'/g, "\\'")}')">
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
    
    selectRecipe(recipeId, recipeName, rank, searchIngredients) {
        try {
            const decisionTime = this.searchStartTime ? (Date.now() - this.searchStartTime) / 1000 : 0;
            
            const choiceData = {
                userId: this.currentUser?.id || 'unknown',
                testGroup: this.testGroup || 'unknown',
                recipeId: recipeId,
                recipeName: recipeName,
                rank: rank,
                searchIngredients: searchIngredients,
                decisionTime: decisionTime,
                timestamp: new Date().toISOString()
            };
            
            console.log('✅ Recept választás:', choiceData);
            
            // Helyi tárolás
            this.saveChoiceLocally(choiceData);
            
            alert(`Köszönjük! Választott recept: ${recipeName}`);
            
            this.showSection('thank-you-section');
            
        } catch (error) {
            console.error('❌ Recept választási hiba:', error);
            alert('Választási hiba történt, de rögzítettük a választását.');
        }
    }
    
    saveChoiceLocally(choiceData) {
        try {
            const choices = JSON.parse(localStorage.getItem('userChoices') || '[]');
            choices.push(choiceData);
            localStorage.setItem('userChoices', JSON.stringify(choices));
            console.log('✅ Választás mentve helyileg');
        } catch (error) {
            console.error('❌ Helyi mentés hiba:', error);
        }
    }
    
    showSection(sectionId) {
        try {
            document.querySelectorAll('.section').forEach(section => {
                section.classList.add('hidden');
            });
            
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                console.log(`✅ Szakasz megjelenítve: ${sectionId}`);
            } else {
                console.error(`❌ Szakasz nem található: ${sectionId}`);
            }
        } catch (error) {
            console.error('❌ Szakasz megjelenítési hiba:', error);
        }
    }
}

// Alkalmazás indítása
let app;
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🚀 Alkalmazás indítása...');
        app = new RecipeResearchSystem();
    } catch (error) {
        console.error('❌ Alkalmazás indítási hiba:', error);
        alert('Az alkalmazás indítása sikertelen. Próbálja újratölteni az oldalt.');
    }
});
