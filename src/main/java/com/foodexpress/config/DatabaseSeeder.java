package com.foodexpress.config;

import com.foodexpress.model.Food;
import com.foodexpress.model.User;
import com.foodexpress.repository.FoodRepository;
import com.foodexpress.repository.UserRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;
import java.util.Arrays;
import java.util.List;

@Component
public class DatabaseSeeder implements CommandLineRunner {

    private final UserRepository userRepository;
    private final FoodRepository foodRepository;
    private final PasswordEncoder passwordEncoder;

    public DatabaseSeeder(UserRepository userRepository,
                          FoodRepository foodRepository,
                          PasswordEncoder passwordEncoder) {
        this.userRepository = userRepository;
        this.foodRepository = foodRepository;
        this.passwordEncoder = passwordEncoder;
    }

    @Override
    public void run(String... args) {
        seedUser();
        seedFoods();
    }

    private void seedUser() {
        System.out.println("🌱 Cleaning and seeding developer user...");
        userRepository.deleteAll(); // Force clean slate so the updated credentials apply
        
        User devUser = new User();
        devUser.setName("Developer");
        devUser.setEmail("dev@example.com");
        devUser.setPhone("1234567890");
        devUser.setPassword(passwordEncoder.encode("dev"));
        devUser.setRole("ADMIN");
        
        userRepository.save(devUser);
        System.out.println("✅ Developer user seeded successfully!");
    }

    private void seedFoods() {
        System.out.println("🌱 Cleaning and seeding default food items...");
        foodRepository.deleteAll(); // Force clean slate so updated image URLs apply
        
        List<Food> defaultFoods = Arrays.asList(
            new Food("Chicken Biryani", "Biryani", 349.0, "images/chicken_biryani.jpg", "Aromatic basmati rice cooked with tender chicken, saffron, and traditional spices.", "Paradise Biryani"),
            new Food("Mutton Biryani", "Biryani", 429.0, "images/mutton_biryani.jpg", "Slow-dum cooked mutton on-the-bone with fragrant basmati, whole spices, and saffron milk.", "Shah Ghouse"),
            new Food("Paneer Biryani", "Biryani", 299.0, "images/paneer_biryani.jpg", "Fragrant basmati layered with golden-fried paneer, caramelized onions, and aromatic whole spices.", "Chutneys"),
            new Food("Mutton Haleem", "Haleem", 299.0, "images/mutton_haleem.jpg", "Slow-cooked mutton, wheat, lentils, and ghee, pounded to a rich, savory paste.", "Shah Ghouse"),
            new Food("South Indian Masala Dosa", "Tiffin", 99.0, "images/masala_dosa.jpg", "Crispy fermented rice crepe filled with spiced potato mash, served with chutney and sambar.", "Chutneys"),
            new Food("Soft Steamed Idli Sambar", "Tiffin", 79.0, "images/idli_sambar.jpg", "Fluffy steamed rice cakes served with hot lentil sambar and spicy peanut chutney.", "Chutneys"),
            new Food("Traditional Puri Bhaji", "Tiffin", 89.0, "images/puri_bhaji.png", "Golden, puffy fried whole wheat flatbreads served with a mildly spiced potato curry.", "Bikanervala"),
            new Food("Double Ka Meetha", "Dessert", 149.0, "images/double_ka_meetha.jpg", "Traditional sweet bread pudding soaked in saffron-infused milk and loaded of dry fruits.", "Mehfil Restaurant"),
            new Food("Mirchi Ka Salan", "Curry", 179.0, "images/paneer.jpg", "Tangy and spicy green chili curry prepared with peanuts, sesame seeds, and tamarind.", "Mehfil Restaurant"),
            new Food("Paneer Butter Masala & Butter Naan", "Combos", 349.0, "images/paneer_butter_masala.jpg", "Rich creamy paneer in tomato-butter gravy with golden butter naan. A vegetarian feast.", "Mehfil Restaurant"),
            new Food("Hyderabadi Paneer", "Curry", 259.0, "images/hyderabadi_paneer.jpg", "Paneer in a rich Hyderabadi spinach (saag) gravy with whole spices and fried onions.", "Mehfil Restaurant"),
            new Food("Paneer Tikka", "Starters", 249.0, "images/paneer_tikka.jpg", "Spiced and charred paneer cubes marinated in yogurt and spices, grilled to perfection.", "Mehfil Restaurant"),
            new Food("Paneer Chilli", "Starters", 229.0, "images/paneer.jpg", "Crispy golden paneer tossed with bell peppers and green chilies in an Indo-Chinese soy-chili glaze.", "Mehfil Restaurant"),
            new Food("Special Irani Chai", "Beverages (Hot)", 49.0, "images/irani_chai.jpg", "Rich, creamy, and slow-brewed traditional Irani Chai.", "Irani Cafe"),
            new Food("Irani Cafe Bun Maska", "Breads", 69.0, "images/bun_maska.jpg", "Soft, freshly baked bun loaded with premium salted butter, perfect with Irani Chai.", "Irani Cafe"),
            new Food("Biryani & Thums Up Combo", "Combos", 389.0, "images/biryani_combo.png", "Chicken Biryani served with a chilled bottle of Thums Up. [Combo Discount: 5% Off]", "Shah Ghouse"),
            new Food("Chai & Bun Maska Combo", "Combos", 99.0, "images/chai_bun_combo.png", "Classic pairing of hot Irani Chai and Bun Maska. [Combo Discount: 15% Off]", "Irani Cafe")
        );

        foodRepository.saveAll(defaultFoods);
        System.out.println("✅ Default food items seeded successfully!");
    }

}
