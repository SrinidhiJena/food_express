package com.foodexpress.controller;

import com.foodexpress.model.Food;
import com.foodexpress.model.Order;
import com.foodexpress.model.OrderItem;
import com.foodexpress.model.User;
import com.foodexpress.repository.FoodRepository;
import com.foodexpress.repository.OrderRepository;
import com.foodexpress.repository.UserRepository;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.context.SecurityContextHolder;
import org.springframework.web.bind.annotation.*;
import java.util.ArrayList;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/orders")
public class OrderController {

    private final OrderRepository orderRepository;
    private final FoodRepository foodRepository;
    private final UserRepository userRepository;

    public OrderController(OrderRepository orderRepository,
                           FoodRepository foodRepository,
                           UserRepository userRepository) {
        this.orderRepository = orderRepository;
        this.foodRepository = foodRepository;
        this.userRepository = userRepository;
    }

    @PostMapping("/place")
    public ResponseEntity<Map<String, Object>> placeOrder(@RequestBody OrderRequest request) {
        Map<String, Object> response = new HashMap<>();

        // 1. Validate basic inputs
        if (request.getFoodItems() == null || request.getFoodItems().isEmpty()) {
            response.put("success", false);
            response.put("message", "Please provide a valid list of foodItems containing foodId and quantity");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        if (request.getAddress() == null || request.getAddress().trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "Delivery address is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        // Get authenticated user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email).orElse(null);
        if (currentUser == null) {
            response.put("success", false);
            response.put("message", "Authentication context invalid");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        // 2. Fetch food items from DB and calculate total price securely
        double calculatedTotalPrice = 0;
        List<OrderItem> verifiedFoodItems = new ArrayList<>();

        for (OrderItemRequest item : request.getFoodItems()) {
            String foodId = item.getFoodId();
            Integer quantity = item.getQuantity();

            if (foodId == null || !foodId.matches("^[0-9a-fA-F]{24}$")) {
                response.put("success", false);
                response.put("message", "Invalid food item ID format: " + foodId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            if (quantity == null || quantity < 1) {
                response.put("success", false);
                response.put("message", "Quantity must be a positive integer for food item: " + foodId);
                return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
            }

            Food food = foodRepository.findById(foodId).orElse(null);
            if (food == null) {
                response.put("success", false);
                response.put("message", "Food item not found with ID: " + foodId);
                return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
            }

            calculatedTotalPrice += food.getPrice() * quantity;
            verifiedFoodItems.add(new OrderItem(food, quantity));
        }

        // 3. Create the order
        Order order = new Order();
        order.setUser(currentUser);
        order.setFoodItems(verifiedFoodItems);
        order.setTotalPrice(calculatedTotalPrice);
        order.setAddress(request.getAddress());
        order.setPaymentMethod(request.getPaymentMethod() != null ? request.getPaymentMethod() : "Cash on Delivery");

        Order savedOrder = orderRepository.save(order);

        response.put("success", true);
        response.put("message", "Order placed successfully");
        response.put("data", savedOrder);

        return ResponseEntity.status(HttpStatus.CREATED).body(response);
    }

    @GetMapping("/my-orders")
    public ResponseEntity<Map<String, Object>> getUserOrders() {
        Map<String, Object> response = new HashMap<>();

        // Get authenticated user
        String email = SecurityContextHolder.getContext().getAuthentication().getName();
        User currentUser = userRepository.findByEmail(email).orElse(null);
        if (currentUser == null) {
            response.put("success", false);
            response.put("message", "Authentication context invalid");
            return ResponseEntity.status(HttpStatus.UNAUTHORIZED).body(response);
        }

        List<Order> orders = orderRepository.findByUserOrderByCreatedAtDesc(currentUser);

        response.put("success", true);
        response.put("count", orders.size());
        response.put("data", orders);

        return ResponseEntity.ok(response);
    }

    @GetMapping
    public ResponseEntity<Map<String, Object>> getAllOrders() {
        Map<String, Object> response = new HashMap<>();
        List<Order> orders = orderRepository.findAllByOrderByCreatedAtDesc();
        
        response.put("success", true);
        response.put("count", orders.size());
        response.put("data", orders);
        
        return ResponseEntity.ok(response);
    }

    @PatchMapping("/{id}/status")
    public ResponseEntity<Map<String, Object>> updateOrderStatus(@PathVariable String id, @RequestBody Map<String, String> body) {
        Map<String, Object> response = new HashMap<>();

        // Validate hex ID format (24 characters)
        if (id == null || !id.matches("^[0-9a-fA-F]{24}$")) {
            response.put("success", false);
            response.put("message", "Invalid order ID format");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        String status = body.get("orderStatus");
        if (status == null || status.trim().isEmpty()) {
            status = body.get("status");
        }

        if (status == null || status.trim().isEmpty()) {
            response.put("success", false);
            response.put("message", "orderStatus is required");
            return ResponseEntity.status(HttpStatus.BAD_REQUEST).body(response);
        }

        Order order = orderRepository.findById(id).orElse(null);
        if (order == null) {
            response.put("success", false);
            response.put("message", "Order not found");
            return ResponseEntity.status(HttpStatus.NOT_FOUND).body(response);
        }

        order.setOrderStatus(status.trim());
        orderRepository.save(order);

        response.put("success", true);
        response.put("message", "Order status updated successfully");
        response.put("data", order);

        return ResponseEntity.ok(response);
    }

    // Helper request DTO classes
    public static class OrderRequest {
        private List<OrderItemRequest> foodItems;
        private String address;
        private String paymentMethod;

        public List<OrderItemRequest> getFoodItems() { return foodItems; }
        public void setFoodItems(List<OrderItemRequest> foodItems) { this.foodItems = foodItems; }
        public String getAddress() { return address; }
        public void setAddress(String address) { this.address = address; }
        public String getPaymentMethod() { return paymentMethod; }
        public void setPaymentMethod(String paymentMethod) { this.paymentMethod = paymentMethod; }
    }

    public static class OrderItemRequest {
        private String foodId;
        private Integer quantity;

        public String getFoodId() { return foodId; }
        public void setFoodId(String foodId) { this.foodId = foodId; }
        public Integer getQuantity() { return quantity; }
        public void setQuantity(Integer quantity) { this.quantity = quantity; }
    }
}
