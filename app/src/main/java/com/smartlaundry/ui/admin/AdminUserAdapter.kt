package com.smartlaundry.ui.admin

import android.view.LayoutInflater
import android.view.ViewGroup
import androidx.recyclerview.widget.RecyclerView
import com.smartlaundry.data.model.User
import com.smartlaundry.databinding.ItemAdminUserBinding

class AdminUserAdapter(private var usersList: List<User>) : RecyclerView.Adapter<AdminUserAdapter.UserViewHolder>() {

    class UserViewHolder(val binding: ItemAdminUserBinding) : RecyclerView.ViewHolder(binding.root)

    override fun onCreateViewHolder(parent: ViewGroup, viewType: Int): UserViewHolder {
        val binding = ItemAdminUserBinding.inflate(LayoutInflater.from(parent.context), parent, false)
        return UserViewHolder(binding)
    }

    override fun onBindViewHolder(holder: UserViewHolder, position: Int) {
        val user = usersList[position]
        holder.binding.tvUserName.text = user.name
        holder.binding.tvUserRole.text = user.role.uppercase()
        holder.binding.tvUserEmail.text = "Email: ${user.email}"
        holder.binding.tvUserPhone.text = "Phone: ${user.phone}"
        holder.binding.tvUserAddress.text = "Address: ${user.address}"
    }

    override fun getItemCount() = usersList.size

    fun updateList(newList: List<User>) {
        usersList = newList
        notifyDataSetChanged()
    }
}
