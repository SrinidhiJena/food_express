package com.foodexpress.model;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.persistence.*;
import java.util.UUID;

@Entity
@Table(name = "foods")
public class Food {

    @Id
    @JsonProperty("_id")
    private String id;

    @Column(nullable = false)
    private String foodName;

    @Column(nullable = false)
    private String category;

    @Column(nullable = false)
    private double price;

    @Column(nullable = false)
    private String image;

    @Column(nullable = false)
    private String description;

    @Column(nullable = true)
    private String restaurant;

    @PrePersist
    public void ensureId() {
        if (this.id == null) {
            this.id = UUID.randomUUID().toString().replace("-", "").substring(0, 24);
        }
    }

    public Food() {
    }

    public Food(String foodName, String category, double price, String image, String description, String restaurant) {
        this.foodName = foodName;
        this.category = category;
        this.price = price;
        this.image = image;
        this.description = description;
        this.restaurant = restaurant;
    }


    public String getId() {
        return id;
    }

    public void setId(String id) {
        this.id = id;
    }

    public String getFoodName() {
        return foodName;
    }

    public void setFoodName(String foodName) {
        this.foodName = foodName;
    }

    public String getCategory() {
        return category;
    }

    public void setCategory(String category) {
        this.category = category;
    }

    public double getPrice() {
        return price;
    }

    public void setPrice(double price) {
        this.price = price;
    }

    public String getImage() {
        return image;
    }

    public void setImage(String image) {
        this.image = image;
    }

    public String getDescription() {
        return description;
    }

    public void setDescription(String description) {
        this.description = description;
    }

    public String getRestaurant() {
        return restaurant;
    }

    public void setRestaurant(String restaurant) {
        this.restaurant = restaurant;
    }
}

