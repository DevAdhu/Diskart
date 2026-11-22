package com.store.ecommerce.controller;

import com.store.ecommerce.dto.PagedResponse;
import com.store.ecommerce.model.Product;
import com.store.ecommerce.service.ProductService;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;
import org.springframework.data.domain.PageImpl;
import org.springframework.test.web.servlet.MockMvc;
import org.springframework.test.web.servlet.setup.MockMvcBuilders;

import java.util.List;

import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.when;
import static org.springframework.test.web.servlet.request.MockMvcRequestBuilders.get;
import static org.springframework.test.web.servlet.result.MockMvcResultMatchers.status;

@ExtendWith(MockitoExtension.class)
class ProductControllerBrandBindingTest {

    @Mock
    private ProductService productService;

    private MockMvc mockMvc;

    @BeforeEach
    void setUp() {
        mockMvc = MockMvcBuilders.standaloneSetup(new ProductController(productService)).build();
    }

    private void stubBrands(List<String> brands) {
        when(productService.getProductsPaged(
                0, 12, "name,asc", null, null, null, null, brands, null))
                .thenReturn(PagedResponse.from(new PageImpl<>(List.<Product>of())));
    }

    @Test
    void commaSeparatedBrandValuesBindAsList() throws Exception {
        stubBrands(List.of("Apple", "Samsung"));

        mockMvc.perform(get("/api/products/paged").param("brand", "Apple,Samsung"))
                .andExpect(status().isOk());

        verify(productService).getProductsPaged(
                0, 12, "name,asc", null, null, null, null,
                List.of("Apple", "Samsung"), null);
    }

    @Test
    void singleBrandValueBindsAsSingleElementList() throws Exception {
        stubBrands(List.of("Apple"));

        mockMvc.perform(get("/api/products/paged").param("brand", "Apple"))
                .andExpect(status().isOk());

        verify(productService).getProductsPaged(
                0, 12, "name,asc", null, null, null, null, List.of("Apple"), null);
    }
}
