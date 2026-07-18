package com.foodexpress;

import org.junit.jupiter.api.Test;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.boot.test.context.SpringBootTest;
import org.springframework.boot.test.web.client.TestRestTemplate;
import org.springframework.boot.test.web.server.LocalServerPort;
import org.springframework.http.*;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import static org.junit.jupiter.api.Assertions.*;

@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.RANDOM_PORT)
class FoodExpressApplicationTests {

    @LocalServerPort
    private int port;

    @Autowired
    private TestRestTemplate restTemplate;

    private String getBaseUrl() {
        return "http://localhost:" + port;
    }

    @Test
    void contextLoads() {
    }

    @Test
    @SuppressWarnings("unchecked")
    void testAuthenticationAndOrderWorkflow() {
        // 1. Verify Dynamic Menu Retrieval (Public Endpoint)
        ResponseEntity<Map> menuResponse = restTemplate.getForEntity(getBaseUrl() + "/api/foods", Map.class);
        assertEquals(HttpStatus.OK, menuResponse.getStatusCode());
        assertNotNull(menuResponse.getBody());
        assertTrue((Boolean) menuResponse.getBody().get("success"));
        List<Map<String, Object>> foods = (List<Map<String, Object>>) menuResponse.getBody().get("data");
        assertNotNull(foods);
        assertTrue(foods.size() >= 4, "Should seed at least 4 default foods");

        // Verify seeded food items
        boolean hasPizza = false;
        boolean hasBurger = false;
        for (Map<String, Object> food : foods) {
            String name = (String) food.get("foodName");
            if ("Chicken Biryani".equals(name)) hasPizza = true;
            if ("South Indian Masala Dosa".equals(name)) hasBurger = true;
        }
        assertTrue(hasPizza, "Seeded foods should contain Chicken Biryani");
        assertTrue(hasBurger, "Seeded foods should contain South Indian Masala Dosa");

        // Get Chicken Biryani ID for order placement testing
        String pizzaId = null;
        for (Map<String, Object> food : foods) {
            if ("Chicken Biryani".equals(food.get("foodName"))) {
                pizzaId = (String) food.get("_id");
                break;
            }
        }
        assertNotNull(pizzaId);


        // 2. Verify Developer Login
        Map<String, String> loginRequest = new HashMap<>();
        loginRequest.put("email", "dev@foodexpress.com");
        loginRequest.put("password", "dev@123");

        ResponseEntity<Map> loginResponse = restTemplate.postForEntity(getBaseUrl() + "/api/auth/login", loginRequest, Map.class);
        assertEquals(HttpStatus.OK, loginResponse.getStatusCode());
        assertNotNull(loginResponse.getBody());
        assertTrue((Boolean) loginResponse.getBody().get("success"));
        Map<String, Object> loginData = (Map<String, Object>) loginResponse.getBody().get("data");
        assertNotNull(loginData);
        String token = (String) loginData.get("token");
        assertNotNull(token);

        // 3. Verify Unauthorized Order Placement (Rejects direct requests without token)
        Map<String, Object> orderRequest = new HashMap<>();
        orderRequest.put("address", "123 Dev Lane");
        orderRequest.put("paymentMethod", "Cash on Delivery");
        
        Map<String, Object> orderItem = new HashMap<>();
        orderItem.put("foodId", pizzaId);
        orderItem.put("quantity", 2);
        orderRequest.put("foodItems", List.of(orderItem));

        ResponseEntity<Map> unauthOrderResponse = restTemplate.postForEntity(getBaseUrl() + "/api/orders/place", orderRequest, Map.class);
        assertEquals(HttpStatus.FORBIDDEN, unauthOrderResponse.getStatusCode(), "Request without token must be forbidden");

        // 4. Verify Authorized Order Placement
        HttpHeaders headers = new HttpHeaders();
        headers.setBearerAuth(token);
        headers.setContentType(MediaType.APPLICATION_JSON);

        HttpEntity<Map<String, Object>> authEntity = new HttpEntity<>(orderRequest, headers);
        ResponseEntity<Map> orderPlaceResponse = restTemplate.postForEntity(getBaseUrl() + "/api/orders/place", authEntity, Map.class);
        assertEquals(HttpStatus.CREATED, orderPlaceResponse.getStatusCode());
        assertNotNull(orderPlaceResponse.getBody());
        assertTrue((Boolean) orderPlaceResponse.getBody().get("success"));
        Map<String, Object> orderData = (Map<String, Object>) orderPlaceResponse.getBody().get("data");
        assertNotNull(orderData);
        assertEquals("Pending", orderData.get("orderStatus"));
        assertEquals(698.0, ((Number) orderData.get("totalPrice")).doubleValue(), 0.01, "Total price should be 349 * 2 = 698");

        // 5. Verify Order History Retrieval
        HttpEntity<Void> historyEntity = new HttpEntity<>(headers);
        ResponseEntity<Map> historyResponse = restTemplate.exchange(getBaseUrl() + "/api/orders/my-orders", HttpMethod.GET, historyEntity, Map.class);
        assertEquals(HttpStatus.OK, historyResponse.getStatusCode());
        assertNotNull(historyResponse.getBody());
        assertTrue((Boolean) historyResponse.getBody().get("success"));
        List<Map<String, Object>> ordersList = (List<Map<String, Object>>) historyResponse.getBody().get("data");
        assertNotNull(ordersList);
        assertFalse(ordersList.isEmpty());
        
        Map<String, Object> firstOrder = ordersList.get(0);
        assertEquals("123 Dev Lane", firstOrder.get("address"));
        assertEquals(698.0, ((Number) firstOrder.get("totalPrice")).doubleValue(), 0.01);
    }
}
