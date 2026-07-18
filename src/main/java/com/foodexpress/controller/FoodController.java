package com.foodexpress.controller;

import com.foodexpress.model.Food;
import com.foodexpress.repository.FoodRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/foods")
public class FoodController {

    private final FoodRepository foodRepository;

    public FoodController(FoodRepository foodRepository) {
        this.foodRepository = foodRepository;
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getFoods() {
        Map<String, Object> response = new HashMap<>();
        List<Food> foods = foodRepository.findAll();
        
        response.put("success", true);
        response.put("count", foods.size());
        response.put("data", foods);
        
        return ResponseEntity.ok(response);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Map<String, Object>> getFoodById(@PathVariable String id) {
        Map<String, Object> response = new HashMap<>();

        // Validate hex ID format (24 characters)
        if (id == null || !id.matches("^[0-9a-fA-F]{24}$")) {
            response.put("success", false);
            response.put("message", "Invalid food item ID format");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        Food food = foodRepository.findById(id).orElse(null);
        if (food == null) {
            response.put("success", false);
            response.put("message", "Food item not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        response.put("success", true);
        response.put("data", food);

        return ResponseEntity.ok(response);
    }

    @PostMapping("/add")
    public ResponseEntity<Map<String, Object>> addFood(@RequestBody FoodRequest request) {
        Map<String, Object> response = new HashMap<>();

        // 1. Validate inputs
        if (request.getFoodName() == null || request.getFoodName().trim().isEmpty() ||
            request.getCategory() == null || request.getCategory().trim().isEmpty() ||
            request.getPrice() == null || request.getImage() == null || request.getImage().trim().isEmpty() ||
            request.getDescription() == null || request.getDescription().trim().isEmpty()) {
            
            response.put("success", false);
            response.put("message", "Please provide all required fields: foodName, category, price, image, description");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        if (request.getPrice() < 0) {
            response.put("success", false);
            response.put("message", "Price must be a valid positive number");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // 2. Create food item
        Food food = new Food();
        food.setFoodName(request.getFoodName());
        food.setCategory(request.getCategory());
        food.setPrice(request.getPrice());
        food.setImage(request.getImage());
        food.setDescription(request.getDescription());

        Food savedFood = foodRepository.save(food);

        response.put("success", true);
        response.put("message", "Food item added successfully");
        response.put("data", savedFood);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    // Helper request DTO class
    public static class FoodRequest {
        private String foodName;
        private String category;
        private Double price;
        private String image;
        private String description;

        public String getFoodName() { return foodName; }
        public void setFoodName(String foodName) { this.foodName = foodName; }
        public String getCategory() { return category; }
        public void setCategory(String category) { this.category = category; }
        public Double getPrice() { return price; }
        public void setPrice(Double price) { this.price = price; }
        public String getImage() { return image; }
        public void setImage(String image) { this.image = image; }
        public String getDescription() { return description; }
        public void setDescription(String description) { this.description = description; }
    }
}
