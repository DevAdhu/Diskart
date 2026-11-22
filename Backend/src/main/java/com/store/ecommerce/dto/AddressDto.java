package com.store.ecommerce.dto;

import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;

/** Shape returned by every /api/addresses endpoint. */
@Data
public class AddressDto {

    private Long id;
    private String label;
    private String line1;
    private String line2;
    private String city;
    private String state;
    private String postalCode;
    private String country;
    private String phone;

    @JsonProperty("isDefault")
    private boolean isDefault;

    /** Explicit getter keeps the JSON key as "isDefault" (not "default"). */
    @JsonProperty("isDefault")
    public boolean isDefault() {
        return isDefault;
    }
}
