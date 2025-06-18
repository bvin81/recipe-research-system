// Recipe Research System - LEGFRISSEBB TELJES VERZIÓ
// 1000 magyar recept + minden továbbfejlesztés + JAVÍTOTT KÖRNYEZETI LOGIKA

class RecipeResearchSystem {
    constructor() {
        this.recipes = [];
        this.currentUser = null;
        this.testGroup = null;
        this.searchStartTime = null;
        
        this.initializeApp();
    }
    
    async initializeApp() {
        console.log('🚀 Recipe Research System - Legfrissebb verzió indítása...');
        console.log('📅 Verzió: 2025.06.18 - Magyar receptekkel + Javított környezeti logika');
        
        // Adatok betöltése (valós vagy fallback)
        await this.loadEnhancedData();
        
        // Event listenrek beállítása
        this.setupEventListeners();
        
        // Felhasználó ellenőrzése
        this.checkExistingUser();
        
        console.log('✅ Alkalmazás kész! Receptek száma:', this.recipes.length);
    }
    
    async loadEnhancedData() {
        console.log('📋 Valós magyar receptadatok betöltése...');
        
        try {
            // Megpróbáljuk betölteni a 1000 magyar receptet
            const response = await fetch('./data/recipes_hungarian_best1000.json');
            
            if (response.ok) {
                this.recipes = await response.json();
                console.log('✅ Magyar receptek sikeresen betöltve:', this.recipes.length, 'recept');
                
                // Statisztikák
                if (this.recipes.length > 0) {
                    const avgSustainability = this.recipes.reduce((sum, r) => sum + (r.sustainability_index || 0), 0) / this.recipes.length;
                    console.log('📊 Átlagos fenntarthatóság:', avgSustainability.toFixed(1));
                    
                    // Receptek előkészítése
                    this.prepareRecipes();
                }
                
            } else {
                throw new Error(`HTTP ${response.status}: Magyar receptek nem elérhetők`);
            }
            
        } catch (error) {
            console.warn('⚠️ Magyar receptek betöltése sikertelen:', error.message);
            console.log('🔄 Fallback teszt adatok használata...');
            this.loadFallbackData();
        }
    }
    
    prepareRecipes() {
        console.log('🔧 Receptek előkészítése...');
        
        let categorizedCount = 0;
        
        // Kategóriák és ikonok hozzáadása
        this.recipes.forEach((recipe, index) => {
            // Kategória hozzáadása ha nincs
            if (!recipe.category) {
                recipe.category = this.determineCategory(recipe);
                categorizedCount++;
            }
            
            // Ikon hozzáadása
            if (!recipe.categoryIcon) {
                recipe.categoryIcon = this.getCategoryIcon(recipe.category);
            }
            
            // Biztonságos értékek
            recipe.env_score = recipe.env_score || 0;
            recipe.nutri_score = recipe.nutri_score || 0;
            recipe.sustainability_index = recipe.sustainability_index || 0;
            recipe.name = recipe.name || `Recept #${recipe.recipeid || index + 1}`;
            recipe.ingredients = recipe.ingredients || 'Ismeretlen hozzávalók';
        });
        
        // Kategória statisztikák
        const categoryCounts = {};
        this.recipes.forEach(recipe => {
            const cat = recipe.category || 'egyéb';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        
        console.log('🏷️ Kategóriák hozzáadva:', categorizedCount, 'recepthez');
        console.log('📊 Kategória megoszlás:', categoryCounts);
    }
    
    determineCategory(recipe) {
        const name = (recipe.name || '').toLowerCase();
        const ingredients = (recipe.ingredients || '').toLowerCase();
        const text = name + ' ' + ingredients;
        
        // Kategória szabályok (magyar nyelvre optimalizálva)
        const categoryRules = {
            'leves': ['leves', 'húslé', 'alaplé', 'soup', 'broth'],
            'saláta': ['saláta', 'salad', 'uborka', 'lettuce', 'vegyes'],
            'főétel': ['csirke', 'chicken', 'marhahús', 'beef', 'hal', 'fish', 'sertéshús', 'pork', 'tészta', 'pasta', 'rizs', 'rice', 'steak', 'schnitzel'],
            'desszert': ['cukor', 'sugar', 'méz', 'honey', 'csokoládé', 'chocolate', 'sütemény', 'cake', 'torta', 'keksz'],
            'ital': ['smoothie', 'juice', 'tea', 'coffee', 'ital', 'shake', 'koktél'],
            'reggeli': ['tojás', 'egg', 'omlett', 'pancake', 'müzli', 'cereal', 'zabkása', 'pirítós'],
            'köret': ['burgonya', 'potato', 'sárgarépa', 'carrot', 'brokkoli', 'spárga', 'zöldség köret']
        };
        
        // Első találat alapján kategorizálás
        for (const [category, keywords] of Object.entries(categoryRules)) {
            if (keywords.some(keyword => text.includes(keyword))) {
                return category;
            }
        }
        
        return 'egyéb';
    }
    
    getCategoryIcon(category) {
        const categoryIcons = {
            'főétel': '🍽️',
            'leves': '🍲',
            'saláta': '🥗',
            'desszert': '🍰',
            'ital': '🥤',
            'reggeli': '🍳',
            'köret': '🥄',
            'egyéb': '🍴'
        };
        
        return categoryIcons[category] || '🍴';
    }
    
    loadFallbackData() {
        console.log('🔄 Fallback teszt adatok betöltése...');
        
        this.recipes = [
            {
                recipeid: 1,
                name: "Zöldség Saláta",
                ingredients: "Saláta, Paradicsom, Uborka, Hagyma, Olívaolaj",
                env_score: 6.2,
                nutri_score: 58.1,
                sustainability_index: 82.3,
                category: "saláta",
                categoryIcon: "🥗"
            },
            {
                recipeid: 2,
                name: "Csirke Recept",
                ingredients: "Csirke, Hagyma, Paradicsom, Só, Bors",
                env_score: 25.4,
                nutri_score: 45.8,
                sustainability_index: 68.5,
                category: "főétel",
                categoryIcon: "🍽️"
            },
            {
                recipeid: 3,
                name: "Gyümölcs Smoothie",
                ingredients: "Banán, Eper, Joghurt, Méz, Áfonya",
                env_score: 8.7,
                nutri_score: 62.4,
                sustainability_index: 78.9,
                category: "ital",
                categoryIcon: "🥤"
            },
            {
                recipeid: 4,
                name: "Zöldséges Leves",
                ingredients: "Paradicsomlé, Káposzta, Hagyma, Sárgarépa",
                env_score: 11.3,
                nutri_score: 51.3,
                sustainability_index: 72.1,
                category: "leves",
                categoryIcon: "🍲"
            },
            {
                recipeid: 5,
                name: "Tejszínes Tészta",
                ingredients: "Tészta, Tejszín, Sajt, Fokhagyma, Petrezselyem",
                env_score: 30.2,
                nutri_score: 38.9,
                sustainability_index: 55.3,
                category: "főétel",
                categoryIcon: "🍽️"
            },
            {
                recipeid: 6,
                name: "Marhahús Steak",
                ingredients: "Marhahús, Só, Bors, Fokhagyma, Rozmaring",
                env_score: 65.8,
                nutri_score: 71.2,
                sustainability_index: 35.4,
                category: "főétel",
                categoryIcon: "🍽️"
            },
            {
                recipeid: 7,
                name: "Hal Filé",
                ingredients: "Hal, Citrom, Petrezselyem, Vaj, Fehérbor",
                env_score: 22.1,
                nutri_score: 67.3,
                sustainability_index: 69.8,
                category: "főétel",
                categoryIcon: "🍽️"
            },
            {
                recipeid: 8,
                name: "Áfonyás Joghurt",
                ingredients: "Áfonya, Cukor, Joghurt, Citromlé",
                env_score: 12.1,
                nutri_score: 18.9,
                sustainability_index: 65.2,
                category: "desszert",
                categoryIcon: "🍰"
            }
        ];
        
        console.log('✅ Fallback adatok betöltve:', this.recipes.length, 'recept');
        
        // Fallback esetén is kategorizálás
        this.prepareRecipes();
    }
    
    setupEventListeners() {
        console.log('🎧 Event listeners beállítása...');
        
        try {
            // Regisztráció
            const regForm = document.getElementById('registration-form');
            if (regForm) {
                regForm.addEventListener('submit', (e) => {
                    e.preventDefault();
                    this.handleRegistration();
                });
            }
            
            // Keresés gomb
            const searchBtn = document.getElementById('search-btn');
            if (searchBtn) {
                searchBtn.addEventListener('click', () => {
                    this.handleSearch();
                });
            }
            
            // Enter billentyű a kereséshez
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
                    if (searchInput) searchInput.value = '';
                    const resultsDiv = document.getElementById('search-results');
                    if (resultsDiv) resultsDiv.innerHTML = '';
                });
            }
            
            console.log('✅ Event listeners sikeresen beállítva');
            
        } catch (error) {
            console.error('❌ Event listener beállítási hiba:', error);
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
                console.log('👤 Meglévő felhasználó betöltve:', this.testGroup + ' csoport');
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
            const emailInput = document.getElementById('email');
            if (!emailInput) {
                throw new Error('Email mező nem található');
            }
            
            const email = emailInput.value.trim();
            if (!email) {
                alert('Kérjük, adjon meg érvényes email címet!');
                return;
            }
            
            // Egyedi User ID generálás
            const userId = Date.now() + Math.random().toString(36).substr(2, 9);
            
            // A/B/C teszt csoport hozzárendelés
            const testGroup = this.assignTestGroup(userId);
            
            // Felhasználó objektum
            const user = {
                id: userId,
                email: email,
                testGroup: testGroup,
                registeredAt: new Date().toISOString(),
                version: '2025.06.18'
            };
            
            // Mentés
            this.currentUser = user;
            this.testGroup = testGroup;
            localStorage.setItem('recipeUser', JSON.stringify(user));
            
            console.log('✅ Regisztráció sikeres:', user);
            
            // UI átváltás
            this.showSection('search-section');
            this.updateUserDisplay();
            
        } catch (error) {
            console.error('❌ Regisztrációs hiba:', error);
            alert('Regisztrációs hiba történt. Kérjük, próbálja újra!');
        }
    }
    
    assignTestGroup(userId) {
        // Hash alapú konzisztens csoport hozzárendelés (33-33-34%)
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
                'A': 'Kontroll csoport - alapvető receptek',
                'B': 'Fenntarthatósági pontszámokkal',
                'C': 'Fenntarthatóság + részletes AI magyarázatok'
            };
            
            const userGroupElement = document.getElementById('user-group');
            if (userGroupElement) {
                userGroupElement.textContent = 
                    this.testGroup + ' (' + groupDescriptions[this.testGroup] + ')';
            }
            
            console.log('👥 Csoport megjelenítve:', this.testGroup);
        } catch (error) {
            console.error('❌ Felhasználói megjelenítés hiba:', error);
        }
    }
    
    handleSearch() {
        try {
            const searchInput = document.getElementById('ingredient-search');
            if (!searchInput) {
                throw new Error('Keresési mező nem található');
            }
            
            const ingredients = searchInput.value.trim();
            if (!ingredients) {
                alert('Kérjük, adjon meg legalább egy hozzávalót!');
                return;
            }
            
            console.log('🔍 Keresés indítása:', ingredients);
            
            // Keresési idő mérésének kezdete
            this.searchStartTime = Date.now();
            
            // Intelligens ajánlások lekérése
            const results = this.getIntelligentRecommendations(ingredients);
            
            // Eredmények megjelenítése
            this.displayResults(results, ingredients);
            
        } catch (error) {
            console.error('❌ Keresési hiba:', error);
            alert('Keresési hiba történt. Kérjük, próbálja újra!');
        }
    }
    
    getIntelligentRecommendations(searchIngredients) {
        const ingredientList = searchIngredients.toLowerCase().split(',').map(s => s.trim());
        console.log('🔎 Keresett hozzávalók:', ingredientList);
        
        // 1. Pontos találatok keresése
        let exactMatches = this.recipes.filter(recipe => {
            const recipeIngredients = recipe.ingredients.toLowerCase();
            return ingredientList.some(ingredient => 
                recipeIngredients.includes(ingredient)
            );
        });
        
        console.log('🎯 Pontos találatok:', exactMatches.length);
        
        // 2. Ha kevés találat, részleges keresés
        if (exactMatches.length < 5) {
            const partialMatches = this.recipes.filter(recipe => {
                const recipeIngredients = recipe.ingredients.toLowerCase();
                const recipeName = recipe.name.toLowerCase();
                const fullText = recipeIngredients + ' ' + recipeName;
                
                return ingredientList.some(ingredient => {
                    if (ingredient.length > 2) {
                        // Részleges egyezés (első 3-4 karakter)
                        const partial = ingredient.substring(0, Math.min(4, ingredient.length));
                        return fullText.includes(partial);
                    }
                    return false;
                });
            });
            
            // Egyesítés és duplikátumok eltávolítása
            const allMatches = [...exactMatches];
            partialMatches.forEach(recipe => {
                if (!allMatches.some(existing => existing.recipeid === recipe.recipeid)) {
                    allMatches.push(recipe);
                }
            });
            
            exactMatches = allMatches;
            console.log('🔍 Részleges találatokkal kiegészítve:', exactMatches.length);
        }
        
        // 3. Ha még mindig kevés találat, legjobb receptek hozzáadása
        if (exactMatches.length < 8) {
            const topRecipes = this.recipes
                .filter(recipe => !exactMatches.some(existing => existing.recipeid === recipe.recipeid))
                .sort((a, b) => (b.sustainability_index || 0) - (a.sustainability_index || 0))
                .slice(0, 8 - exactMatches.length);
            
            exactMatches = [...exactMatches, ...topRecipes];
            console.log('⭐ Legjobb receptekkel kiegészítve:', exactMatches.length);
        }
        
        // 4. Csoport specifikus rendezés
        const sortedResults = this.applySortingStrategy(exactMatches);
        
        // 5. Maximum 10 recept visszaadása
        const finalResults = sortedResults.slice(0, 10);
        
        console.log('📋 Végső eredmények:', finalResults.length, 'recept');
        return finalResults;
    }
    
    // ✅ JAVÍTOTT: Rendezési stratégia környezetbarát logikával
    applySortingStrategy(recipes) {
        switch (this.testGroup) {
            case 'A':
                // Kontroll csoport: véletlenszerű sorrend
                console.log('🎲 A csoport: véletlenszerű rendezés');
                return this.shuffleArray([...recipes]);
                
            case 'B':
            case 'C':
                // ✅ JAVÍTOTT: Fenntarthatósági csoportok: környezetbarát rendezés
                console.log('🌱 B/C csoport: környezetbarát rendezés');
                return this.sortRecipesBySustainability(recipes);
                
            default:
                return recipes;
        }
    }
    
    // ✅ ÚJ: Környezetbarát rendezés (alacsony env_score = jobb)
    sortRecipesBySustainability(recipes) {
        return recipes.sort((a, b) => {
            // 1. Elsődleges: fenntarthatóság index (magasabb = jobb)
            const sustainabilityDiff = (b.sustainability_index || 0) - (a.sustainability_index || 0);
            if (Math.abs(sustainabilityDiff) > 5) {
                return sustainabilityDiff;
            }
            
            // 2. Másodlagos: környezeti pontszám (ALACSONYABB = jobb!)
            const envDiff = (a.env_score || 0) - (b.env_score || 0);
            if (Math.abs(envDiff) > 2) {
                return envDiff;
            }
            
            // 3. Harmadlagos: táplálkozási pontszám (magasabb = jobb)
            return (b.nutri_score || 0) - (a.nutri_score || 0);
        });
    }
    
    // ✅ ÚJ: Környezeti színkódolás (alacsony = zöld)
    getEnvironmentalColor(score) {
        // Alacsony pontszám = jó a környezetnek = zöld
        if (score <= 20) return '#4CAF50';      // Zöld - környezetbarát
        if (score <= 50) return '#FF9800';      // Narancs - közepes
        return '#F44336';                       // Piros - környezetszennyező
    }
    
    // ✅ ÚJ: Környezeti címkék
    getEnvironmentalLabel(score) {
        if (score <= 20) return 'Környezetbarát';
        if (score <= 50) return 'Közepes hatás';
        return 'Nagy környezeti terhelés';
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
        
        if (!resultsDiv) {
            console.error('❌ Eredmények div nem található');
            return;
        }
        
        if (recipes.length === 0) {
            resultsDiv.innerHTML = `
                <div style="text-align: center; padding: 2rem; color: #666;">
                    <h3>🔍 Nincs találat</h3>
                    <p>Nem találtunk receptet a keresett hozzávalókkal.</p>
                    <p><strong>Próbálja ezeket:</strong> csirke, hal, saláta, tészta, joghurt, paradicsom, hagyma, tej, tojás</p>
                </div>
            `;
            return;
        }
        
        let html = `
            <div style="margin-bottom: 1.5rem; padding: 1rem; background: #f8f9fa; border-radius: 8px;">
                <h3>📋 Ajánlott receptek (${recipes.length} találat)</h3>
                <p style="color: #666; font-size: 0.9rem; margin: 0.5rem 0 0 0;">
                    🔍 Keresés: "<strong>${searchIngredients}</strong>" | 
                    👥 Csoport: <strong>${this.testGroup}</strong> | 
                    📊 ${this.getGroupDescription()}
                </p>
            </div>
        `;
        
        recipes.forEach((recipe, index) => {
            html += this.generateEnhancedRecipeCard(recipe, index, searchIngredients);
        });
        
        resultsDiv.innerHTML = html;
        console.log('✅ Eredmények megjelenítve:', recipes.length, 'recept');
    }
    
    getGroupDescription() {
        switch (this.testGroup) {
            case 'A': return 'Véletlenszerű sorrend';
            case 'B': return 'Fenntarthatóság szerint rendezve';
            case 'C': return 'Fenntarthatóság + AI magyarázatok';
            default: return '';
        }
    }
    
    generateEnhancedRecipeCard(recipe, index, searchIngredients) {
        const showScores = ['B', 'C'].includes(this.testGroup);
        const showXAI = this.testGroup === 'C';
        
        const categoryIcon = recipe.categoryIcon || '🍴';
        
        return `
            <div class="recipe-card" style="margin-bottom: 1.5rem; border: 2px solid #e9ecef; border-radius: 12px; padding: 1.5rem; background: #ffffff;">
                <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 1rem;">
                    <div class="recipe-name" style="flex: 1; font-size: 1.25rem; font-weight: bold; color: #2c3e50;">
                        ${categoryIcon} ${recipe.name}
                    </div>
                    <div style="font-size: 0.8rem; color: #6c757d; margin-left: 1rem; background: #e9ecef; padding: 2px 8px; border-radius: 12px;">
                        #${index + 1}
                    </div>
                </div>
                
                <div class="recipe-ingredients" style="margin-bottom: 1rem; line-height: 1.4;">
                    <strong>🥗 Hozzávalók:</strong> ${this.highlightSearchTerms(recipe.ingredients, searchIngredients)}
                </div>
                
                ${showScores ? this.generateScoreSection(recipe) : ''}
                
                ${showXAI ? this.generateXAISection(recipe) : ''}
                
                <button class="select-recipe-btn" 
                        onclick="app.selectRecipe(${recipe.recipeid}, '${recipe.name.replace(/'/g, "\\'")}', ${index + 1}, '${searchIngredients.replace(/'/g, "\\'")}')">
                    ✅ Ezt választom
                </button>
            </div>
        `;
    }
    
    highlightSearchTerms(ingredients, searchTerms) {
        let highlighted = ingredients;
        const terms = searchTerms.toLowerCase().split(',').map(s => s.trim());
        
        terms.forEach(term => {
            if (term.length > 1) {
                const regex = new RegExp(`(${term})`, 'gi');
                highlighted = highlighted.replace(regex, '<mark style="background: #fff3cd; padding: 1px 3px; border-radius: 3px; font-weight: bold;">$1</mark>');
            }
        });
        
        return highlighted;
    }
    
    // ✅ JAVÍTOTT: Pontszám szekció környezeti színezéssel
    generateScoreSection(recipe) {
        const sustainabilityLevel = this.getSustainabilityLevel(recipe.sustainability_index || 0);
        const envColor = this.getEnvironmentalColor(recipe.env_score || 0);
        const envLabel = this.getEnvironmentalLabel(recipe.env_score || 0);
        
        return `
            <div class="sustainability-scores" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid ${sustainabilityLevel.color};">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <div class="score env-score" style="font-size: 0.9rem; padding: 0.5rem; background: ${envColor}; color: white; border-radius: 4px; text-align: center;">
                        🌍 Környezeti: <strong>${(recipe.env_score || 0).toFixed(1)}</strong><br>
                        <small style="font-size: 0.8rem;">${envLabel}</small>
                    </div>
                    <div class="score nutri-score" style="font-size: 0.9rem; padding: 0.5rem; background: #28a745; color: white; border-radius: 4px; text-align: center;">
                        💚 Táplálkozási: <strong>${(recipe.nutri_score || 0).toFixed(1)}</strong>
                    </div>
                </div>
                <div class="score" style="text-align: center; font-weight: bold; padding: 0.75rem; background: ${sustainabilityLevel.color}; border-radius: 6px; color: white; font-size: 1rem;">
                    ⭐ Fenntarthatóság: ${(recipe.sustainability_index || 0).toFixed(1)}/100 (${sustainabilityLevel.label})
                </div>
            </div>
        `;
    }
    
    getSustainabilityLevel(score) {
        if (score >= 75) return { label: 'Kiváló', color: '#28a745' };
        if (score >= 60) return { label: 'Jó', color: '#17a2b8' };
        if (score >= 40) return { label: 'Közepes', color: '#ffc107' };
        return { label: 'Fejleszthető', color: '#dc3545' };
    }
    
    generateXAISection(recipe) {
        return `
            <div class="xai-explanation" style="background: linear-gradient(135deg, #f0f8ff 0%, #e6f3ff 100%); border: 2px solid #b6d7ff; border-radius: 10px; padding: 1.25rem; margin: 1rem 0;">
                <div style="font-weight: bold; color: #0066cc; margin-bottom: 0.75rem; font-size: 1.1rem;">
                    🧠 AI Magyarázat - Miért ajánljuk ezt a receptet:
                </div>
                <div style="color: #2c3e50; line-height: 1.5; font-size: 0.95rem;">
                    ${this.generateDetailedXAI(recipe)}
                </div>
            </div>
        `;
    }
    
    // ✅ JAVÍTOTT: AI magyarázat környezeti logikával
    generateDetailedXAI(recipe) {
        const sustainability = recipe.sustainability_index || 0;
        const envScore = recipe.env_score || 0;
        const nutriScore = recipe.nutri_score || 0;
        const category = recipe.category || 'egyéb';
        
        let explanation = "";
        
        // ✅ JAVÍTOTT Fenntarthatósági értékelés
        if (sustainability >= 75) {
            explanation += "🌟 <strong>Kiváló fenntartható választás!</strong> ";
            if (envScore <= 20) {  // ← JAVÍTVA: alacsony = jó
                explanation += "Rendkívül alacsony környezeti hatással készül. ";
            }
            if (nutriScore > 60) {
                explanation += "Magas tápértékű és egészséges. ";
            }
            explanation += "Ez a recept kiválóan illeszkedik a fenntartható életmódhoz. ";
        } else if (sustainability >= 60) {
            explanation += "✅ <strong>Jó fenntartható választás.</strong> ";
            if (envScore <= 30) {  // ← JAVÍTVA: alacsony = jó
                explanation += "Viszonylag alacsony környezeti hatás. ";
            }
            if (nutriScore > 45) {
                explanation += "Egészséges és tápláló. ";
            }
            explanation += "Kiegyensúlyozott opció a fenntarthatóság és az íz között. ";
        } else if (sustainability >= 40) {
            explanation += "⚖️ <strong>Közepes fenntarthatóságú választás.</strong> ";
            if (envScore > 50) {  // ← JAVÍTVA: magas = rossz
                explanation += "Magasabb környezeti hatással jár. ";
            }
            explanation += "Alkalmanként fogyasztva elfogadható. ";
        } else {
            explanation += "⚠️ <strong>Kevésbé fenntartható, de ízletes választás.</strong> ";
            if (envScore > 60) {  // ← JAVÍTVA: magas = rossz
                explanation += "Jelentős környezeti hatással jár. ";
            }
            explanation += "Ritkábban fogyasztva élvezhető. ";
        }
        
        // ✅ JAVÍTOTT Kategória specifikus tanácsok
        switch (category) {
            case 'főétel':
                if (envScore > 40) {  // ← JAVÍTVA: magas env_score = rossz
                    explanation += "<br><em>💡 Tipp: Próbálja növényi köretekkel kombinálni a környezeti hatás csökkentéséhez.</em>";
                } else {
                    explanation += "<br><em>👍 Remek főétel választás a fenntartható táplálkozáshoz!</em>";
                }
                break;
            case 'saláta':
                explanation += "<br><em>🥗 Kiváló választás az egészséges és fenntartható táplálkozáshoz!</em>";
                break;
            case 'ital':
                explanation += "<br><em>🥤 Frissítő és egészséges italválasztás!</em>";
                break;
            case 'leves':
                explanation += "<br><em>🍲 Tápláló és fenntartható leves opció!</em>";
                break;
            case 'desszert':
                if (envScore <= 30) {  // ← JAVÍTVA: alacsony = jó
                    explanation += "<br><em>🍰 Fenntartható desszert - nyugodt szívvel élvezhető!</em>";
                } else {
                    explanation += "<br><em>🍰 Édes finomság - mértékkel fogyasztva.</em>";
                }
                break;
            case 'reggeli':
                explanation += "<br><em>🍳 Energiadús reggeli a nap kezdéséhez!</em>";
                break;
        }
        
        return explanation;
    }
    
    selectRecipe(recipeId, recipeName, rank, searchIngredients) {
        try {
            // Döntési idő számítása
            const decisionTime = this.searchStartTime ? (Date.now() - this.searchStartTime) / 1000 : 0;
            
            // Kiválasztott recept adatainak kinyerése
            const selectedRecipe = this.recipes.find(r => r.recipeid == recipeId);
            
            // Választási adatok összeállítása
            const choiceData = {
                userId: this.currentUser.id,
                userEmail: this.currentUser.email,
                testGroup: this.testGroup,
                recipeId: recipeId,
                recipeName: recipeName,
                recipeCategory: selectedRecipe ? selectedRecipe.category : 'unknown',
                rank: rank,
                searchIngredients: searchIngredients,
                decisionTime: decisionTime,
                sustainabilityIndex: selectedRecipe ? selectedRecipe.sustainability_index : 0,
                envScore: selectedRecipe ? selectedRecipe.env_score : 0,
                nutriScore: selectedRecipe ? selectedRecipe.nutri_score : 0,
                timestamp: new Date().toISOString(),
                sessionId: this.currentUser.id + '_' + Date.now(),
                version: '2025.06.18'
            };
            
            console.log('✅ Recept választás rögzítve:', choiceData);
            
            // Helyi tárolás
            this.saveChoiceLocally(choiceData);
            
            // Felhasználói visszajelzés
            this.showSuccessMessage(recipeName, decisionTime, selectedRecipe);
            
            // Következő szakasz
            this.showSection('thank-you-section');
            
        } catch (error) {
            console.error('❌ Recept választási hiba:', error);
            alert('A választás rögzítése során hiba történt, de a recept ki lett választva.');
            this.showSection('thank-you-section');
        }
    }
    
    saveChoiceLocally(choiceData) {
        try {
            const choices = JSON.parse(localStorage.getItem('userChoices') || '[]');
            choices.push(choiceData);
            localStorage.setItem('userChoices', JSON.stringify(choices));
            
            // Statisztikák frissítése
            const totalChoices = choices.length;
            const avgDecisionTime = choices.reduce((sum, choice) => sum + (choice.decisionTime || 0), 0) / totalChoices;
            const userChoices = choices.filter(choice => choice.userId === this.currentUser.id);
            
            console.log('💾 Választás mentve helyben');
            console.log('📊 Statisztikák:');
            console.log('   - Összes választás:', totalChoices);
            console.log('   - Felhasználó választásai:', userChoices.length);
            console.log('   - Átlagos döntési idő:', avgDecisionTime.toFixed(1) + 's');
            
        } catch (error) {
            console.error('❌ Helyi mentési hiba:', error);
        }
    }
    
    showSuccessMessage(recipeName, decisionTime, selectedRecipe) {
        const sustainabilityText = selectedRecipe && selectedRecipe.sustainability_index 
            ? `\n🌱 Fenntarthatóság: ${selectedRecipe.sustainability_index.toFixed(1)}/100`
            : '';
            
        const categoryText = selectedRecipe && selectedRecipe.category
            ? `\n📂 Kategória: ${selectedRecipe.category}`
            : '';
            
        const message = `Köszönjük a választását!\n\n🍽️ Választott recept: ${recipeName}${categoryText}${sustainabilityText}\n⏱️ Döntési idő: ${decisionTime.toFixed(1)} másodperc\n\n✅ A választás sikeresen rögzítve!`;
        
        alert(message);
    }
    
    showSection(sectionId) {
        try {
            // Minden szakasz elrejtése
            document.querySelectorAll('.section').forEach(section => {
                section.classList.add('hidden');
            });
            
            // Cél szakasz megjelenítése
            const targetSection = document.getElementById(sectionId);
            if (targetSection) {
                targetSection.classList.remove('hidden');
                console.log('📄 Szakasz váltás:', sectionId);
            } else {
                console.error('❌ Szakasz nem található:', sectionId);
            }
        } catch (error) {
            console.error('❌ Szakasz megjelenítési hiba:', error);
        }
    }
}

// Alkalmazás globális példánya
let app;

// Alkalmazás indítása a DOM betöltése után
document.addEventListener('DOMContentLoaded', () => {
    try {
        console.log('🌟 Recipe Research System - Legfrissebb verzió indítása...');
        console.log('📅 Verzió: 2025.06.18 - 1000 Magyar Recept + JAVÍTOTT KÖRNYEZETI LOGIKA');
        app = new RecipeResearchSystem();
    } catch (error) {
        console.error('❌ Alkalmazás indítási hiba:', error);
        alert('Az alkalmazás indítása sikertelen. Kérjük, töltse újra az oldalt.');
    }
});

// Debug és fejlesztői funkciók (Console-ban használhatók)
window.debugApp = {
    // Felhasználói adatok megjelenítése
    showUserData: () => {
        console.log('👤 Jelenlegi felhasználó:', app.currentUser);
        console.log('📊 Összes választás:', JSON.parse(localStorage.getItem('userChoices') || '[]'));
        console.log('🎯 Teszt csoport:', app.testGroup);
    },
    
    // Receptek táblázatos megjelenítése
    showRecipes: (limit = 20) => {
        const recipes = app.recipes.slice(0, limit);
        console.table(recipes.map(r => ({
            id: r.recipeid,
            name: r.name.substring(0, 30),
            category: r.category,
            sustainability: r.sustainability_index?.toFixed(1),
            env: r.env_score?.toFixed(1),
            nutri: r.nutri_score?.toFixed(1)
        })));
        console.log(`Megjelenítve: ${recipes.length}/${app.recipes.length} recept`);
    },
    
    // Keresés szimulálása
    simulateSearch: (term) => {
        if (app.recipes.length === 0) {
            console.warn('Nincs betöltött recept!');
            return;
        }
        document.getElementById('ingredient-search').value = term;
        app.handleSearch();
        console.log(`Keresés szimulálva: "${term}"`);
    },
    
    // Statisztikák megjelenítése
    showStats: () => {
        const choices = JSON.parse(localStorage.getItem('userChoices') || '[]');
        const userChoices = choices.filter(c => c.userId === app.currentUser?.id);
        
        console.log('📈 Alkalmazás statisztikák:');
        console.log('   Betöltött receptek:', app.recipes.length);
        console.log('   Összes választás:', choices.length);
        console.log('   Felhasználó választásai:', userChoices.length);
        
        if (choices.length > 0) {
            const avgDecisionTime = choices.reduce((sum, c) => sum + c.decisionTime, 0) / choices.length;
            console.log('   Átlagos döntési idő:', avgDecisionTime.toFixed(1) + 's');
            
            // Csoport breakdown
            const groupBreakdown = {};
            choices.forEach(c => {
                groupBreakdown[c.testGroup] = (groupBreakdown[c.testGroup] || 0) + 1;
            });
            console.log('   Csoport megoszlás:', groupBreakdown);
        }
    },
    
    // Kategóriák elemzése
    analyzeCategories: () => {
        const categories = {};
        app.recipes.forEach(recipe => {
            const cat = recipe.category || 'egyéb';
            categories[cat] = (categories[cat] || 0) + 1;
        });
        
        console.log('📊 Kategória megoszlás:');
        Object.entries(categories)
            .sort((a, b) => b[1] - a[1])
            .forEach(([cat, count]) => {
                const percentage = ((count / app.recipes.length) * 100).toFixed(1);
                console.log(`   ${cat}: ${count} recept (${percentage}%)`);
            });
    },
    
    // Adatok törlése és újraindítás
    clearData: () => {
        if (confirm('Biztosan törli az összes helyi adatot és újraindítja az alkalmazást?')) {
            localStorage.clear();
            location.reload();
        }
    },
    
    // Export adatok CSV formátumban
    exportChoices: () => {
        const choices = JSON.parse(localStorage.getItem('userChoices') || '[]');
        if (choices.length === 0) {
            console.log('Nincs exportálandó adat');
            return;
        }
        
        const csv = [
            // Header
            Object.keys(choices[0]).join(','),
            // Rows
            ...choices.map(choice => Object.values(choice).join(','))
        ].join('\n');
        
        console.log('CSV Export:');
        console.log(csv);
        
        // Download trigger (ha szükséges)
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recipe_choices_${new Date().getTime()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
};
