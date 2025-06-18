// Recipe Research System - JAVÍTOTT FENNTARTHATÓSÁG SZÁMÍTÁS
// Eco-Score alapú fenntarthatóság + 0 értékek kiszűrése

class RecipeResearchSystem {
    constructor() {
        this.recipes = [];
        this.currentUser = null;
        this.testGroup = null;
        this.searchStartTime = null;
        
        this.initializeApp();
    }
    
    async initializeApp() {
        console.log('🚀 Recipe Research System - Javított fenntarthatóság számítás');
        console.log('📅 Verzió: 2025.06.18 - Eco-Score alapú rendszer');
        
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
            const response = await fetch('./data/recipes_hungarian_best1000.json');
            
            if (response.ok) {
                this.recipes = await response.json();
                console.log('✅ Magyar receptek sikeresen betöltve:', this.recipes.length, 'recept');
                
                // Receptek előkészítése és fenntarthatóság újraszámítása
                this.prepareRecipes();
                
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
        console.log('🔧 Receptek előkészítése és fenntarthatóság újraszámítása...');
        
        let validRecipes = 0;
        let filteredRecipes = [];
        let recalculatedCount = 0;
        
        this.recipes.forEach((recipe, index) => {
            // ✅ 1. ÉRVÉNYES RECEPTEK SZŰRÉSE (0 értékek kiszűrése)
            const envScore = recipe.env_score || 0;
            const nutriScore = recipe.nutri_score || 0;
            
            // Ha valamelyik pontszám 0 vagy hiányzik, kihagyjuk
            if (envScore <= 0 || nutriScore <= 0) {
                console.log(`❌ Recept kihagyva (0 pontszám): ${recipe.name || 'Névtelen'} - env:${envScore}, nutri:${nutriScore}`);
                return; // Kihagyjuk ezt a receptet
            }
            
            // ✅ 2. FENNTARTHATÓSÁG ÚJRASZÁMÍTÁSA (Eco-Score alapú formula)
            const originalSustainability = recipe.sustainability_index || 0;
            const calculatedSustainability = this.calculateSustainabilityScore(recipe);
            
            recipe.sustainability_index = calculatedSustainability;
            recalculatedCount++;
            
            if (Math.abs(originalSustainability - calculatedSustainability) > 10) {
                console.log(`🔄 Fenntarthatóság változás: ${recipe.name?.substring(0, 30)} - ${originalSustainability.toFixed(1)} → ${calculatedSustainability.toFixed(1)}`);
            }
            
            // ✅ 3. KATEGÓRIA ÉS IKON HOZZÁADÁSA
            if (!recipe.category) {
                recipe.category = this.determineCategory(recipe);
            }
            
            if (!recipe.categoryIcon) {
                recipe.categoryIcon = this.getCategoryIcon(recipe.category);
            }
            
            // ✅ 4. BIZTONSÁGOS ÉRTÉKEK
            recipe.name = recipe.name || `Recept #${recipe.recipeid || index + 1}`;
            recipe.ingredients = recipe.ingredients || 'Ismeretlen hozzávalók';
            
            // Érvényes recept hozzáadása
            filteredRecipes.push(recipe);
            validRecipes++;
        });
        
        // Szűrt receptek használata
        this.recipes = filteredRecipes;
        
        // Statisztikák
        const categoryCounts = {};
        this.recipes.forEach(recipe => {
            const cat = recipe.category || 'egyéb';
            categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
        });
        
        console.log('✅ Előkészítés befejezve:');
        console.log('   - Érvényes receptek:', validRecipes);
        console.log('   - Újraszámított fenntarthatóság:', recalculatedCount);
        console.log('   - Kategória megoszlás:', categoryCounts);
        
        // Fenntarthatóság statisztikák
        if (this.recipes.length > 0) {
            const avgSustainability = this.recipes.reduce((sum, r) => sum + (r.sustainability_index || 0), 0) / this.recipes.length;
            const minSustainability = Math.min(...this.recipes.map(r => r.sustainability_index || 0));
            const maxSustainability = Math.max(...this.recipes.map(r => r.sustainability_index || 0));
            
            console.log('📊 Fenntarthatóság statisztikák:');
            console.log(`   - Átlag: ${avgSustainability.toFixed(1)}`);
            console.log(`   - Min: ${minSustainability.toFixed(1)}`);
            console.log(`   - Max: ${maxSustainability.toFixed(1)}`);
        }
    }
    
    // ✅ ÚJ: Eco-Score alapú fenntarthatóság számítás
    calculateSustainabilityScore(recipe) {
        const envScore = recipe.env_score || 0;
        const nutriScore = recipe.nutri_score || 0;
        
        // Ha valamelyik 0, akkor nem számítható
        if (envScore <= 0 || nutriScore <= 0) {
            return 0;
        }
        
        // Eco-Score alapú formula:
        // Sustainability = (100 - környezeti_hatás) * 0.6 + táplálkozási_érték * 0.4
        
        // 1. Környezeti komponens (fordított, mert alacsony env_score = jobb)
        const environmentalComponent = Math.max(0, 100 - envScore);
        
        // 2. Táplálkozási komponens (magas nutri_score = jobb)
        const nutritionalComponent = Math.min(100, nutriScore);
        
        // 3. Súlyozott átlag (60% környezeti, 40% táplálkozási)
        const sustainabilityScore = (environmentalComponent * 0.6) + (nutritionalComponent * 0.4);
        
        // 4. Kategória bónusz/malus
        const categoryModifier = this.getCategoryModifier(recipe.category);
        
        // 5. Végső pontszám (0-100 közé korlátozva)
        const finalScore = Math.max(0, Math.min(100, sustainabilityScore + categoryModifier));
        
        return finalScore;
    }
    
    // ✅ ÚJ: Kategória alapú módosítók
    getCategoryModifier(category) {
        // Különböző kategóriák különböző fenntarthatósági bónuszokat/malusokat kapnak
        const categoryModifiers = {
            'saláta': +5,      // Zöldségek fenntarthatóak
            'leves': +3,       // Kevés feldolgozás
            'ital': +2,        // Általában gyümölcsök
            'reggeli': +1,     // Változó
            'köret': 0,        // Semleges
            'egyéb': 0,        // Semleges
            'főétel': -2,      // Gyakran hús
            'desszert': -3     // Cukor, feldolgozás
        };
        
        return categoryModifiers[category] || 0;
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
                env_score: 8.2,
                nutri_score: 75.1,
                category: "saláta",
                categoryIcon: "🥗"
            },
            {
                recipeid: 2,
                name: "Csirke Recept",
                ingredients: "Csirke, Hagyma, Paradicsom, Só, Bors",
                env_score: 45.4,
                nutri_score: 62.8,
                category: "főétel",
                categoryIcon: "🍽️"
            },
            {
                recipeid: 3,
                name: "Gyümölcs Smoothie",
                ingredients: "Banán, Eper, Joghurt, Méz, Áfonya",
                env_score: 12.7,
                nutri_score: 68.4,
                category: "ital",
                categoryIcon: "🥤"
            },
            {
                recipeid: 4,
                name: "Zöldséges Leves",
                ingredients: "Paradicsomlé, Káposzta, Hagyma, Sárgarépa",
                env_score: 15.3,
                nutri_score: 58.3,
                category: "leves",
                categoryIcon: "🍲"
            },
            {
                recipeid: 5,
                name: "Tejszínes Tészta",
                ingredients: "Tészta, Tejszín, Sajt, Fokhagyma, Petrezselyem",
                env_score: 38.2,
                nutri_score: 45.9,
                category: "főétel",
                categoryIcon: "🍽️"
            },
            {
                recipeid: 6,
                name: "Marhahús Steak",
                ingredients: "Marhahús, Só, Bors, Fokhagyma, Rozmaring",
                env_score: 78.8,
                nutri_score: 71.2,
                category: "főétel",
                categoryIcon: "🍽️"
            }
        ];
        
        // Fallback esetén is újraszámítás
        this.prepareRecipes();
        
        console.log('✅ Fallback adatok betöltve és feldolgozva:', this.recipes.length, 'recept');
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
                version: '2025.06.18-eco'
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
                'B': 'Eco-Score alapú fenntarthatósági pontszámokkal',
                'C': 'Eco-Score + részletes AI magyarázatok'
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
        
        // ✅ 1. CSAK ÉRVÉNYES RECEPTEK (0 pontszámok már kiszűrve)
        console.log('📊 Elérhető érvényes receptek:', this.recipes.length);
        
        // 2. Pontos találatok keresése
        let exactMatches = this.recipes.filter(recipe => {
            const recipeIngredients = recipe.ingredients.toLowerCase();
            return ingredientList.some(ingredient => 
                recipeIngredients.includes(ingredient)
            );
        });
        
        console.log('🎯 Pontos találatok:', exactMatches.length);
        
        // 3. Ha kevés találat, részleges keresés
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
        
        // 4. Ha még mindig kevés találat, legjobb receptek hozzáadása
        if (exactMatches.length < 8) {
            const topRecipes = this.recipes
                .filter(recipe => !exactMatches.some(existing => existing.recipeid === recipe.recipeid))
                .sort((a, b) => (b.sustainability_index || 0) - (a.sustainability_index || 0))
                .slice(0, 8 - exactMatches.length);
            
            exactMatches = [...exactMatches, ...topRecipes];
            console.log('⭐ Legjobb receptekkel kiegészítve:', exactMatches.length);
        }
        
        // 5. Csoport specifikus rendezés
        const sortedResults = this.applySortingStrategy(exactMatches);
        
        // 6. Maximum 10 recept visszaadása
        const finalResults = sortedResults.slice(0, 10);
        
        console.log('📋 Végső eredmények:', finalResults.length, 'recept');
        
        // Debug: fenntarthatóság ellenőrzése
        finalResults.forEach((recipe, idx) => {
            console.log(`   ${idx+1}. ${recipe.name?.substring(0, 25)} - Fenntarthatóság: ${recipe.sustainability_index.toFixed(1)} (env: ${recipe.env_score}, nutri: ${recipe.nutri_score})`);
        });
        
        return finalResults;
    }
    
    // ✅ JAVÍTOTT: Eco-Score alapú rendezés
    applySortingStrategy(recipes) {
        switch (this.testGroup) {
            case 'A':
                // Kontroll csoport: véletlenszerű sorrend
                console.log('🎲 A csoport: véletlenszerű rendezés');
                return this.shuffleArray([...recipes]);
                
            case 'B':
            case 'C':
                // ✅ JAVÍTOTT: Eco-Score alapú fenntarthatósági rendezés
                console.log('🌱 B/C csoport: Eco-Score alapú fenntarthatósági rendezés');
                return this.sortRecipesByEcoScore(recipes);
                
            default:
                return recipes;
        }
    }
    
    // ✅ ÚJ: Eco-Score alapú rendezés
    sortRecipesByEcoScore(recipes) {
        return recipes.sort((a, b) => {
            // 1. Elsődleges: újraszámított fenntarthatóság index (magasabb = jobb)
            const sustainabilityDiff = (b.sustainability_index || 0) - (a.sustainability_index || 0);
            if (Math.abs(sustainabilityDiff) > 3) {
                return sustainabilityDiff;
            }
            
            // 2. Másodlagos: környezeti pontszám (ALACSONYABB = jobb!)
            const envDiff = (a.env_score || 0) - (b.env_score || 0);
            if (Math.abs(envDiff) > 5) {
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
        if (score <= 40) return '#8BC34A';      // Világoszöld - jó
        if (score <= 60) return '#FF9800';      // Narancs - közepes
        return '#F44336';                       // Piros - környezetszennyező
    }
    
    // ✅ ÚJ: Környezeti címkék
    getEnvironmentalLabel(score) {
        if (score <= 20) return 'Kiváló környezetbarát';
        if (score <= 40) return 'Környezetbarát';
        if (score <= 60) return 'Közepes környezeti hatás';
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
                    <p>Nem találtunk érvényes receptet a keresett hozzávalókkal.</p>
                    <p><strong>Próbálja ezeket:</strong> csirke, hal, saláta, tészta, joghurt, paradicsom, hagyma, tej, tojás</p>
                    <p><em>Megjegyzés: Csak olyan recepteket jelenítünk meg, amelyek rendelkeznek környezeti és táplálkozási pontszámmal.</em></p>
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
                <p style="color: #28a745; font-size: 0.8rem; margin: 0.25rem 0 0 0;">
                    ✅ Csak érvényes pontszámokkal rendelkező receptek
                </p>
            </div>
        `;
        
        recipes.forEach((recipe, index) => {
            html += this.generateEnhancedRecipeCard(recipe, index, searchIngredients);
        });
        
        resultsDiv.innerHTML = html;
        console.log('✅ Eredmények megjelenítve:', recipes.length, 'érvényes recept');
    }
    
    getGroupDescription() {
        switch (this.testGroup) {
            case 'A': return 'Véletlenszerű sorrend';
            case 'B': return 'Eco-Score alapú rendezés';
            case 'C': return 'Eco-Score + AI magyarázatok';
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
                
                ${showScores ? this.generateEcoScoreSection(recipe) : ''}
                
                ${showXAI ? this.generateEcoXAISection(recipe) : ''}
                
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
    
    // ✅ JAVÍTOTT: Eco-Score alapú pontszám szekció
    generateEcoScoreSection(recipe) {
        const sustainabilityLevel = this.getSustainabilityLevel(recipe.sustainability_index || 0);
        const envColor = this.getEnvironmentalColor(recipe.env_score || 0);
        const envLabel = this.getEnvironmentalLabel(recipe.env_score || 0);
        
        // Táplálkozási színkódolás
        const nutriColor = this.getNutritionalColor(recipe.nutri_score || 0);
        const nutriLabel = this.getNutritionalLabel(recipe.nutri_score || 0);
        
        return `
            <div class="sustainability-scores" style="background: #f8f9fa; padding: 1rem; border-radius: 8px; margin: 1rem 0; border-left: 4px solid ${sustainabilityLevel.color};">
                <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 0.5rem; margin-bottom: 0.5rem;">
                    <div class="score env-score" style="font-size: 0.9rem; padding: 0.5rem; background: ${envColor}; color: white; border-radius: 4px; text-align: center;">
                        🌍 Környezeti: <strong>${(recipe.env_score || 0).toFixed(1)}</strong><br>
                        <small style="font-size: 0.8rem;">${envLabel}</small>
                    </div>
                    <div class="score nutri-score" style="font-size: 0.9rem; padding: 0.5rem; background: ${nutriColor}; color: white; border-radius: 4px; text-align: center;">
                        💚 Táplálkozási: <strong>${(recipe.nutri_score || 0).toFixed(1)}</strong><br>
                        <small style="font-size: 0.8rem;">${nutriLabel}</small>
                    </div>
                </div>
                <div class="score" style="text-align: center; font-weight: bold; padding: 0.75rem; background: ${sustainabilityLevel.color}; border-radius: 6px; color: white; font-size: 1rem;">
                    ⭐ Eco-Score: ${(recipe.sustainability_index || 0).toFixed(1)}/100 (${sustainabilityLevel.label})
                </div>
                <div style="font-size: 0.7rem; color: #666; text-align: center; margin-top: 0.5rem;">
                    📊 Számított érték: 60% környezeti + 40% táplálkozási + kategória bónusz
                </div>
            </div>
        `;
    }
    
    // ✅ ÚJ: Táplálkozási színkódolás
    getNutritionalColor(score) {
        if (score >= 70) return '#4CAF50';      // Zöld - kiváló
        if (score >= 50) return '#8BC34A';      // Világoszöld - jó
        if (score >= 30) return '#FF9800';      // Narancs - közepes
        return '#F44336';                       // Piros - rossz
    }
    
    // ✅ ÚJ: Táplálkozási címkék
    getNutritionalLabel(score) {
        if (score >= 70) return 'Kiváló tápérték';
        if (score >= 50) return 'Jó tápérték';
        if (score >= 30) return 'Közepes tápérték';
        return 'Alacsony tápérték';
    }
    
    getSustainabilityLevel(score) {
        if (score >= 75) return { label: 'Kiváló', color: '#4CAF50' };
        if (score >= 60) return { label: 'Jó', color: '#8BC34A' };
        if (score >= 40) return { label: 'Közepes', color: '#FF9800' };
        if (score >= 20) return { label: 'Fejleszthető', color: '#FF5722' };
        return { label: 'Gyenge', color: '#F44336' };
    }
    
    // ✅ JAVÍTOTT: Eco-Score alapú XAI magyarázat
    generateEcoXAISection(recipe) {
        return `
            <div class="xai-explanation" style="background: linear-gradient(135deg, #e8f5e8 0%, #f0f8ff 100%); border: 2px solid #4CAF50; border-radius: 10px; padding: 1.25rem; margin: 1rem 0;">
                <div style="font-weight: bold; color: #2E7D32; margin-bottom: 0.75rem; font-size: 1.1rem;">
                    🧠 Eco-Score AI Magyarázat - Miért ez a pontszám:
                </div>
                <div style="color: #2c3e50; line-height: 1.5; font-size: 0.95rem;">
                    ${this.generateEcoDetailedXAI(recipe)}
                </div>
            </div>
        `;
    }
    
    // ✅ JAVÍTOTT: Eco-Score alapú részletes AI magyarázat
    generateEcoDetailedXAI(recipe) {
        const sustainability = recipe.sustainability_index || 0;
        const envScore = recipe.env_score || 0;
        const nutriScore = recipe.nutri_score || 0;
        const category = recipe.category || 'egyéb';
        
        let explanation = "";
        
        // Számítás magyarázata
        const environmentalComponent = Math.max(0, 100 - envScore);
        const nutritionalComponent = Math.min(100, nutriScore);
        const categoryModifier = this.getCategoryModifier(category);
        
        explanation += `📊 <strong>Számítás részletei:</strong><br>`;
        explanation += `• Környezeti komponens (100-${envScore}): <strong>${environmentalComponent.toFixed(1)}</strong> × 60% = ${(environmentalComponent * 0.6).toFixed(1)}<br>`;
        explanation += `• Táplálkozási komponens: <strong>${nutritionalComponent.toFixed(1)}</strong> × 40% = ${(nutritionalComponent * 0.4).toFixed(1)}<br>`;
        if (categoryModifier !== 0) {
            explanation += `• Kategória bónusz (${category}): <strong>${categoryModifier > 0 ? '+' : ''}${categoryModifier}</strong><br>`;
        }
        explanation += `• <strong>Végső Eco-Score: ${sustainability.toFixed(1)}/100</strong><br><br>`;
        
        // Értékelés és tanácsok
        if (sustainability >= 75) {
            explanation += "🌟 <strong>Kiváló fenntartható választás!</strong> ";
            explanation += "Ez a recept mind környezeti, mind táplálkozási szempontból előnyös. ";
        } else if (sustainability >= 60) {
            explanation += "✅ <strong>Jó fenntartható választás.</strong> ";
            explanation += "Kiegyensúlyozott környezeti és táplálkozási tulajdonságokkal. ";
        } else if (sustainability >= 40) {
            explanation += "⚖️ <strong>Közepes fenntarthatóságú választás.</strong> ";
            explanation += "Van mit javítani a fenntarthatóságon. ";
        } else {
            explanation += "⚠️ <strong>Kevésbé fenntartható választás.</strong> ";
            explanation += "Alkalmanként fogyasztva elfogadható. ";
        }
        
        // Részletes elemzés
        if (envScore <= 20) {
            explanation += "Kiváló környezeti teljesítmény! ";
        } else if (envScore <= 40) {
            explanation += "Jó környezeti teljesítmény. ";
        } else if (envScore <= 60) {
            explanation += "Közepes környezeti hatás. ";
        } else {
            explanation += "Magas környezeti terhelés. ";
        }
        
        if (nutriScore >= 70) {
            explanation += "Kiváló táplálkozási értékkel. ";
        } else if (nutriScore >= 50) {
            explanation += "Jó táplálkozási értékkel. ";
        } else {
            explanation += "Közepes táplálkozási értékkel. ";
        }
        
        // Kategória specifikus tanácsok
        explanation += "<br><br>";
        switch (category) {
            case 'saláta':
                explanation += "<em>🥗 Salátakategória: +5 bónusz pont a növényi alapú összetétel miatt.</em>";
                break;
            case 'főétel':
                explanation += "<em>🍽️ Főétel kategória: -2 pont, gyakran magasabb környezeti hatás miatt.</em>";
                break;
            case 'desszert':
                explanation += "<em>🍰 Desszert kategória: -3 pont, cukortartalom és feldolgozottság miatt.</em>";
                break;
            case 'leves':
                explanation += "<em>🍲 Leves kategória: +3 bónusz pont a kevés feldolgozás miatt.</em>";
                break;
            case 'ital':
                explanation += "<em>🥤 Ital kategória: +2 bónusz pont a természetes összetevők miatt.</em>";
                break;
            default:
                explanation += "<em>🍴 Semleges kategória, nincs bónusz módosítás.</em>";
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
                calculatedEcoScore: selectedRecipe ? this.calculateSustainabilityScore(selectedRecipe) : 0,
                timestamp: new Date().toISOString(),
                sessionId: this.currentUser.id + '_' + Date.now(),
                version: '2025.06.18-eco'
            };
            
            console.log('✅ Recept választás rögzítve (Eco-Score):', choiceData);
            
            // Helyi tárolás
            this.saveChoiceLocally(choiceData);
            
            // Felhasználói visszajelzés
            this.showEcoSuccessMessage(recipeName, decisionTime, selectedRecipe);
            
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
            const avgEcoScore = userChoices.reduce((sum, choice) => sum + (choice.sustainabilityIndex || 0), 0) / userChoices.length;
            
            console.log('💾 Eco-Score választás mentve helyben');
            console.log('📊 Statisztikák:');
            console.log('   - Összes választás:', totalChoices);
            console.log('   - Felhasználó választásai:', userChoices.length);
            console.log('   - Átlagos döntési idő:', avgDecisionTime.toFixed(1) + 's');
            console.log('   - Átlagos Eco-Score:', avgEcoScore.toFixed(1));
            
        } catch (error) {
            console.error('❌ Helyi mentési hiba:', error);
        }
    }
    
    showEcoSuccessMessage(recipeName, decisionTime, selectedRecipe) {
        const sustainabilityText = selectedRecipe && selectedRecipe.sustainability_index 
            ? `\n🌱 Eco-Score: ${selectedRecipe.sustainability_index.toFixed(1)}/100`
            : '';
            
        const categoryText = selectedRecipe && selectedRecipe.category
            ? `\n📂 Kategória: ${selectedRecipe.category}`
            : '';
            
        const envText = selectedRecipe && selectedRecipe.env_score
            ? `\n🌍 Környezeti hatás: ${selectedRecipe.env_score.toFixed(1)}`
            : '';
            
        const message = `Köszönjük a választását!\n\n🍽️ Választott recept: ${recipeName}${categoryText}${sustainabilityText}${envText}\n⏱️ Döntési idő: ${decisionTime.toFixed(1)} másodperc\n\n✅ A választás sikeresen rögzítve az Eco-Score rendszerben!`;
        
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
        console.log('🌟 Recipe Research System - Eco-Score verzió indítása...');
        console.log('📅 Verzió: 2025.06.18 - Eco-Score alapú fenntarthatóság számítás');
        console.log('🔬 Újdonságok: Helyes fenntarthatóság formula + 0 értékek kiszűrése');
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
    
    // Receptek Eco-Score elemzéssel
    showRecipes: (limit = 20) => {
        const recipes = app.recipes.slice(0, limit);
        console.table(recipes.map(r => ({
            id: r.recipeid,
            name: r.name.substring(0, 30),
            category: r.category,
            'eco-score': r.sustainability_index?.toFixed(1),
            env: r.env_score?.toFixed(1),
            nutri: r.nutri_score?.toFixed(1),
            'env-comp': Math.max(0, 100 - (r.env_score || 0)).toFixed(1),
            'nutri-comp': Math.min(100, r.nutri_score || 0).toFixed(1)
        })));
        console.log(`Megjelenítve: ${recipes.length}/${app.recipes.length} érvényes recept`);
    },
    
    // Eco-Score számítás tesztelése
    testEcoScore: (recipeId) => {
        const recipe = app.recipes.find(r => r.recipeid == recipeId);
        if (!recipe) {
            console.error('Recept nem található:', recipeId);
            return;
        }
        
        console.log('🧮 Eco-Score számítás teszt:');
        console.log('Recept:', recipe.name);
        console.log('Környezeti pontszám:', recipe.env_score);
        console.log('Táplálkozási pontszám:', recipe.nutri_score);
        console.log('Kategória:', recipe.category);
        console.log('Kategória módosító:', app.getCategoryModifier(recipe.category));
        console.log('Számított Eco-Score:', app.calculateSustainabilityScore(recipe).toFixed(2));
        console.log('Jelenleg tárolt Eco-Score:', recipe.sustainability_index?.toFixed(2));
    },
    
    // Érvénytelen receptek megjelenítése
    showInvalidRecipes: () => {
        // Csak a loadFallbackData esetén működik, mert az eredeti adatok már szűrve vannak
        console.log('⚠️ Ez a funkció csak a fallback adatok betöltése után működik.');
        console.log('Az érvénytelen receptek már ki lettek szűrve a prepareRecipes() függvényben.');
    },
    
    // Kategória breakdown Eco-Score-ral
    analyzeCategoriesWithEcoScore: () => {
        const categories = {};
        app.recipes.forEach(recipe => {
            const cat = recipe.category || 'egyéb';
            if (!categories[cat]) {
                categories[cat] = {
                    count: 0,
                    avgEcoScore: 0,
                    avgEnv: 0,
                    avgNutri: 0
                };
            }
            categories[cat].count++;
            categories[cat].avgEcoScore += recipe.sustainability_index || 0;
            categories[cat].avgEnv += recipe.env_score || 0;
            categories[cat].avgNutri += recipe.nutri_score || 0;
        });
        
        console.log('📊 Kategória elemzés Eco-Score-ral:');
        Object.entries(categories)
            .sort((a, b) => b[1].count - a[1].count)
            .forEach(([cat, data]) => {
                const avgEco = (data.avgEcoScore / data.count).toFixed(1);
                const avgEnv = (data.avgEnv / data.count).toFixed(1);
                const avgNutri = (data.avgNutri / data.count).toFixed(1);
                console.log(`   ${cat}: ${data.count} recept | Eco-Score: ${avgEco} | Env: ${avgEnv} | Nutri: ${avgNutri}`);
            });
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
    
    // Teljes statisztikák
    showFullStats: () => {
        const choices = JSON.parse(localStorage.getItem('userChoices') || '[]');
        const userChoices = choices.filter(c => c.userId === app.currentUser?.id);
        
        console.log('📈 Teljes Eco-Score statisztikák:');
        console.log('   Betöltött érvényes receptek:', app.recipes.length);
        console.log('   Összes választás:', choices.length);
        console.log('   Felhasználó választásai:', userChoices.length);
        
        if (app.recipes.length > 0) {
            const avgEcoScore = app.recipes.reduce((sum, r) => sum + (r.sustainability_index || 0), 0) / app.recipes.length;
            const minEcoScore = Math.min(...app.recipes.map(r => r.sustainability_index || 0));
            const maxEcoScore = Math.max(...app.recipes.map(r => r.sustainability_index || 0));
            
            console.log('   Átlagos Eco-Score:', avgEcoScore.toFixed(1));
            console.log('   Min Eco-Score:', minEcoScore.toFixed(1));
            console.log('   Max Eco-Score:', maxEcoScore.toFixed(1));
        }
        
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
    
    // Adatok törlése és újraindítás
    clearData: () => {
        if (confirm('Biztosan törli az összes helyi adatot és újraindítja az alkalmazást?')) {
            localStorage.clear();
            location.reload();
        }
    },
    
    // Export adatok CSV formátumban (Eco-Score mezőkkel)
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
        
        console.log('CSV Export (Eco-Score adatokkal):');
        console.log(csv);
        
        // Download trigger
        const blob = new Blob([csv], { type: 'text/csv' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `recipe_choices_ecoscore_${new Date().getTime()}.csv`;
        a.click();
        URL.revokeObjectURL(url);
    }
};
