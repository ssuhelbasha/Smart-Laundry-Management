package com.smartlaundry.ui.staff

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.smartlaundry.data.model.Order
import com.smartlaundry.databinding.ItemStaffOrderBinding

class StaffOrderAdapter(
    private var orders: List<Order>,
    private val onUpdateClick: (Order) -> Unit
) : RecyclerView.Adapter<StaffOrderAdapter.OrderViewHolder>() {

    fun updateList(newOrders: List<Order>) {
        orders = newOrders
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): OrderViewHolder {
        val binding = ItemStaffOrderBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return OrderViewHolder(binding)
    }

    override fun onBindViewHolder(holder: OrderViewHolder, position: Int) {
        holder.bind(orders[position])
    }

    override fun getItemCount(): Int = orders.size

    inner class OrderViewHolder(private val binding: ItemStaffOrderBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(order: Order) {
            binding.tvItemOrderId.text = "Order #${order.orderId.take(6).uppercase()}"
            binding.tvItemStatus.text = order.status
            binding.tvItemDetails.text = "${order.serviceType} | ${order.totalQuantity} items"
            binding.tvItemAddress.text = "Fabric: ${order.fabricType}"

            // If delivered, disable controls
            if (order.status == "Delivered") {
                binding.btnUpdateStatus.text = "COMPLETED"
                binding.btnUpdateStatus.isEnabled = false
            } else {
                binding.btnUpdateStatus.text = when (order.status) {
                    "Pickup Pending" -> "Mark Picked Up"
                    "Picked Up"      -> "Start Washing"
                    "Washing"        -> "Start Ironing"
                    "Ironing"        -> "Mark Ready"
                    "Ready"          -> "Dispatch / Deliver"
                    else -> "Advance"
                }
                binding.btnUpdateStatus.isEnabled = true
                binding.btnUpdateStatus.setOnClickListener {
                    onUpdateClick(order)
                }
            }
        }
    }
}
