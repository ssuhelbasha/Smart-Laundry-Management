package com.smartlaundry.ui.admin

import android.view.LayoutInflater
import android.view.ViewGroup
import android.widget.PopupMenu
import androidx.recyclerview.widget.RecyclerView
import com.smartlaundry.data.model.Order
import com.smartlaundry.databinding.ItemStaffOrderBinding

class AdminOrderAdapter(
    private var orders: List<Order>,
    private val onStatusUpdate: (String, String) -> Unit
) : RecyclerView.Adapter<AdminOrderAdapter.AdminViewHolder>() {

    fun updateList(newOrders: List<Order>) {
        orders = newOrders
        notifyDataSetChanged()
    }

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): AdminViewHolder {
        val binding = ItemStaffOrderBinding.inflate(
            LayoutInflater.from(parent.context), parent, false
        )
        return AdminViewHolder(binding)
    }

    override fun onBindViewHolder(holder: AdminViewHolder, position: Int) {
        holder.bind(orders[position])
    }

    override fun getItemCount(): Int = orders.size

    inner class AdminViewHolder(private val binding: ItemStaffOrderBinding) :
        RecyclerView.ViewHolder(binding.root) {

        fun bind(order: Order) {
            binding.tvItemOrderId.text = "Order #${order.orderId.take(6).uppercase()}"
            binding.tvItemStatus.text = order.status
            binding.tvItemDetails.text = "${order.serviceType} | ${order.totalQuantity} items"
            binding.tvItemAddress.text = "Cost: ₹${String.format("%.2f", order.totalPrice)} | Payment: ${order.paymentStatus}"

            // Enable status modification for admin
            binding.btnUpdateStatus.visibility = ViewGroup.VISIBLE
            binding.btnUpdateStatus.text = "CHANGE STATUS"
            
            binding.btnUpdateStatus.setOnClickListener {
                val popup = PopupMenu(binding.root.context, binding.btnUpdateStatus)
                val statuses = listOf("Pickup Pending", "Picked Up", "Washing", "Ironing", "Ready", "Delivered")
                statuses.forEachIndexed { index, status ->
                    popup.menu.add(0, index, 0, status)
                }
                popup.setOnMenuItemClickListener { item ->
                    val selectedStatus = statuses[item.itemId]
                    onStatusUpdate(order.orderId, selectedStatus)
                    true
                }
                popup.show()
            }
        }
    }
}
