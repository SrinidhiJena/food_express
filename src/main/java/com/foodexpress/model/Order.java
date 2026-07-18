package com.foodexpress.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "orders")
public class Order {

    @Id
    @JsonProperty("_id")
    private String id;

    @ManyToOne(fetch = FetchType.EAGER)
    @JoinColumn(name = "user_id", nullable = false)
    @JsonProperty("userId")
    private User user;

    @OneToMany(cascade = CascadeType.ALL, fetch = FetchType.EAGER)
    @JoinColumn(name = "order_id")
    private List<OrderItem> foodItems;

    @Column(nullable = false)
    private double totalPrice;

    @Column(nullable = false)
    private String address;

    @Column(nullable = false)
    private String paymentMethod = "Cash on Delivery";

    @Column(nullable = false)
    private String orderStatus = "Pending";

    @Column(nullable = false, updatable = false)
    private LocalDateTime createdAt;

    @PrePersist
    public void prePersist() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        }
        if (this.createdAt == null) {
            this.createdAt = LocalDateTime.now();
        }
    }

    public Order() {
    }

    public Order(User user, List<OrderItem> foodItems, double totalPrice, String address, String paymentMethod) {
        this.user = user;
        this.foodItems = foodItems;
        this.totalPrice = totalPrice;
        this.address = address;
        this.paymentMethod = paymentMethod;
    }

    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public User getUser() {
        return user;
    }

    public void setUser(User user) {
        this.user = user;
    }

    public List<OrderItem> getFoodItems() {
        return foodItems;
    }

    public void setFoodItems(List<OrderItem> foodItems) {
        this.foodItems = foodItems;
    }

    public double getTotalPrice() {
        return totalPrice;
    }

    public void setTotalPrice(double totalPrice) {
        this.totalPrice = totalPrice;
    }

    public String getAddress() {
        return address;
    }

    public void setAddress(String address) {
        this.address = address;
    }

    public String getPaymentMethod() {
        return paymentMethod;
    }

    public void setPaymentMethod(String paymentMethod) {
        this.paymentMethod = paymentMethod;
    }

    public String getOrderStatus() {
        return orderStatus;
    }

    public void setOrderStatus(String orderStatus) {
        this.orderStatus = orderStatus;
    }

    public LocalDateTime getCreatedAt() {
        return createdAt;
    }

    public void setCreatedAt(LocalDateTime createdAt) {
        this.createdAt = createdAt;
    }
}
