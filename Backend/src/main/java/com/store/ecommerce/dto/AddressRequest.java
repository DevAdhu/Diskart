package com.store.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import jakarta.validation.constraints.Size;
import lombok.Data;

/**
 * Request body for creating/updating an address. The owner comes from the JWT,
 * so no id/userId is accepted. Fields are optional to allow partial updates;
 * create validates the required ones in the service layer.
 */
@Data
public class AddressRequest {

    @Size(max = 100, message = "label must be at most 100 characters")
    private String label;

    @Size(max = 255, message = "line1 must be at most 255 characters")
    private String line1;

    @Size(max = 255, message = "line2 must be at most 255 characters")
    private String line2;

    @Size(max = 100, message = "city must be at most 100 characters")
    private String city;

    @Size(max = 100, message = "state must be at most 100 characters")
    private String state;

    @Size(max = 20, message = "postalCode must be at most 20 characters")
    private String postalCode;

    @Size(max = 100, message = "country must be at most 100 characters")
    private String country;

    @Size(max = 20, message = "phone must be at most 20 characters")
    private String phone;

    /** Nullable so a partial update does not accidentally unset an existing default. */
    @JsonProperty("isDefault")
    private Boolean isDefault;
}
