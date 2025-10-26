import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance } from 'axios';

export interface LencoVendor {
  id: string;
  name: string;
  category: string;
  logo?: string;
  isActive: boolean;
}

export interface LencoProduct {
  id: string;
  vendorId: string;
  name: string;
  category: string;
  minAmount: number;
  maxAmount: number;
  fee: number;
  isActive: boolean;
}

export interface LencoCustomerValidation {
  customerId: string;
  customerName: string;
  customerAddress: string;
  isValid: boolean;
  message?: string;
}

export interface LencoBillPaymentRequest {
  productId: string;
  customerId: string;
  debitAccountId: string;
  amount: number;
  reference?: string;
  description?: string;
}

export interface LencoBillPaymentResponse {
  transactionId: string;
  reference: string;
  status: 'pending' | 'successful' | 'failed';
  amount: number;
  fee: number;
  totalAmount: number;
  customerId: string;
  customerName: string;
  timestamp: string;
  message?: string;
}

export interface LencoWebhookEvent {
  event: string;
  data: {
    transactionId: string;
    reference: string;
    status: 'successful' | 'failed';
    amount: number;
    fee: number;
    totalAmount: number;
    customerId: string;
    customerName: string;
    timestamp: string;
    message?: string;
  };
}

@Injectable()
export class LencoService {
  private readonly logger = new Logger(LencoService.name);
  private readonly apiClient: AxiosInstance;
  private readonly baseUrl: string;
  private readonly apiToken: string;

  constructor(private configService: ConfigService) {
    this.baseUrl = this.configService.get('LENCO_API_URL') || 'https://api.lenco.co';
    this.apiToken = this.configService.get('LENCO_API_TOKEN') || '';

    this.apiClient = axios.create({
      baseURL: this.baseUrl,
      headers: {
        'Authorization': `Bearer ${this.apiToken}`,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      timeout: 30000,
    });

    // Add request/response interceptors for logging
    this.apiClient.interceptors.request.use(
      (config) => {
        this.logger.log(`Making request to ${config.method?.toUpperCase()} ${config.url}`);
        return config;
      },
      (error) => {
        this.logger.error('Request error:', error);
        return Promise.reject(error);
      }
    );

    this.apiClient.interceptors.response.use(
      (response) => {
        this.logger.log(`Response from ${response.config.url}: ${response.status}`);
        return response;
      },
      (error) => {
        this.logger.error(`Response error from ${error.config?.url}:`, error.response?.data || error.message);
        return Promise.reject(error);
      }
    );
  }

  async getVendors(): Promise<LencoVendor[]> {
    try {
      const response = await this.apiClient.get('/vendors');
      return response.data.data || [];
    } catch (error) {
      this.logger.error('Error fetching vendors:', error);
      throw new BadRequestException('Failed to fetch utility vendors');
    }
  }

  async getProducts(vendorId?: string): Promise<LencoProduct[]> {
    try {
      const url = vendorId ? `/products?vendorId=${vendorId}` : '/products';
      const response = await this.apiClient.get(url);
      return response.data.data || [];
    } catch (error) {
      this.logger.error('Error fetching products:', error);
      throw new BadRequestException('Failed to fetch utility products');
    }
  }

  async validateCustomer(productId: string, customerId: string): Promise<LencoCustomerValidation> {
    try {
      const response = await this.apiClient.post('/validate-customer', {
        productId,
        customerId,
      });
      return response.data.data;
    } catch (error) {
      this.logger.error('Error validating customer:', error);
      throw new BadRequestException('Failed to validate customer details');
    }
  }

  async initiateBillPayment(paymentRequest: LencoBillPaymentRequest): Promise<LencoBillPaymentResponse> {
    try {
      const response = await this.apiClient.post('/bill-payments', paymentRequest);
      return response.data.data;
    } catch (error) {
      this.logger.error('Error initiating bill payment:', error);
      throw new BadRequestException('Failed to initiate bill payment');
    }
  }

  async getBillPaymentStatus(transactionId: string): Promise<LencoBillPaymentResponse> {
    try {
      const response = await this.apiClient.get(`/bill-payments/${transactionId}`);
      return response.data.data;
    } catch (error) {
      this.logger.error('Error fetching bill payment status:', error);
      throw new BadRequestException('Failed to fetch bill payment status');
    }
  }

  async getBillPaymentHistory(page: number = 1, limit: number = 20): Promise<{
    data: LencoBillPaymentResponse[];
    total: number;
    page: number;
    limit: number;
  }> {
    try {
      const response = await this.apiClient.get(`/bill-payments?page=${page}&limit=${limit}`);
      return response.data;
    } catch (error) {
      this.logger.error('Error fetching bill payment history:', error);
      throw new BadRequestException('Failed to fetch bill payment history');
    }
  }

  async handleWebhook(webhookData: LencoWebhookEvent): Promise<void> {
    try {
      this.logger.log(`Received webhook event: ${webhookData.event}`);
      
      const { data } = webhookData;
      
      // Process the webhook based on event type
      switch (webhookData.event) {
        case 'bill-payment.successful':
          await this.handleSuccessfulPayment(data);
          break;
        case 'bill-payment.failed':
          await this.handleFailedPayment(data);
          break;
        default:
          this.logger.warn(`Unknown webhook event: ${webhookData.event}`);
      }
    } catch (error) {
      this.logger.error('Error handling webhook:', error);
      throw error;
    }
  }

  private async handleSuccessfulPayment(data: any): Promise<void> {
    this.logger.log(`Bill payment successful: ${data.transactionId}`);
    // This will be implemented in the utility bills service
    // to update the payment status and notify the user
  }

  private async handleFailedPayment(data: any): Promise<void> {
    this.logger.log(`Bill payment failed: ${data.transactionId}`);
    // This will be implemented in the utility bills service
    // to update the payment status and notify the user
  }

  // Utility methods for mapping Lenco data to our entities
  mapVendorToUtilityProvider(vendor: LencoVendor): any {
    return {
      name: vendor.name,
      category: vendor.category.toLowerCase(),
      metadata: {
        lenco_vendor_id: vendor.id,
        logo: vendor.logo,
        is_active: vendor.isActive,
      },
    };
  }

  mapProductToUtilityBill(product: LencoProduct, customerId: string): any {
    return {
      product_id: product.id,
      customer_id: customerId,
      amount_due: product.minAmount, // Default to minimum amount
      fee: product.fee,
      metadata: {
        lenco_product_id: product.id,
        vendor_id: product.vendorId,
        category: product.category,
        min_amount: product.minAmount,
        max_amount: product.maxAmount,
      },
    };
  }
}
